CREATE OR REPLACE FUNCTION "public"."get_dashboard_domain_activity"("p_user_id" "uuid", "p_limit" integer DEFAULT 6) 
RETURNS "json"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- セキュリティチェック：認証ユーザーは自身のデータのみ操作可能
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH note_with_domain AS (
    SELECT
      *,
      regexp_replace(url_pattern, '^(?:https?://)?(?:www\.)?([^/]+).*$', '\1') AS domain_name
    FROM public.sitecue_notes
    WHERE user_id = p_user_id AND scope IN ('domain', 'exact')
  ),
  
  top_domains AS (
    SELECT
      domain_name,
      count(*) AS total_count
    FROM note_with_domain
    GROUP BY domain_name
    ORDER BY total_count DESC, domain_name ASC
    LIMIT p_limit
  ),
  
  domain_latest_notes AS (
    SELECT
      td.domain_name,
      COALESCE(
        json_agg(json_build_object('id', ln.id, 'content', ln.content) ORDER BY ln.created_at DESC) 
        FILTER (WHERE ln.id IS NOT NULL), 
        '[]'::json
      ) AS domain_notes
    FROM top_domains td
    LEFT JOIN LATERAL (
      SELECT id, content, created_at
      FROM note_with_domain n2
      WHERE n2.domain_name = td.domain_name AND n2.scope = 'domain'
      ORDER BY n2.created_at DESC
      LIMIT 2
    ) ln ON TRUE
    GROUP BY td.domain_name
  ),
  
  page_ranking AS (
    SELECT
      n.domain_name,
      n.url_pattern AS page_url,
      count(*) AS page_count,
      row_number() OVER (PARTITION BY n.domain_name ORDER BY count(*) DESC, n.url_pattern ASC) as rank
    FROM note_with_domain n
    WHERE n.scope = 'exact'
    GROUP BY n.domain_name, n.url_pattern
  ),
  
  top_pages_filtered AS (
    SELECT domain_name, page_url, page_count
    FROM page_ranking
    WHERE rank <= 3
  ),
  
  page_latest_notes AS (
    SELECT
      tp.domain_name,
      tp.page_url,
      COALESCE(
        json_agg(json_build_object('id', lpn.id, 'content', lpn.content) ORDER BY lpn.created_at DESC)
        FILTER (WHERE lpn.id IS NOT NULL),
        '[]'::json
      ) AS page_notes
    FROM top_pages_filtered tp
    LEFT JOIN LATERAL (
      SELECT id, content, created_at
      FROM note_with_domain n2
      WHERE n2.domain_name = tp.domain_name AND n2.url_pattern = tp.page_url AND n2.scope = 'exact'
      ORDER BY n2.created_at DESC
      LIMIT 2
    ) lpn ON TRUE
    GROUP BY tp.domain_name, tp.page_url
  ),
  
  domain_pages_json AS (
    SELECT
      tp.domain_name,
      json_agg(
        json_build_object(
          'page_url', tp.page_url,
          -- スキーマに title が存在しないため NULL を返し、フロントの getSafeUrl フォールバックへ確実に渡す
          'page_title', NULL,
          'page_count', tp.page_count,
          'page_notes', COALESCE(pn.page_notes, '[]'::json)
        ) ORDER BY tp.page_count DESC, tp.page_url ASC
      ) AS top_pages
    FROM top_pages_filtered tp
    LEFT JOIN page_latest_notes pn ON pn.domain_name = tp.domain_name AND pn.page_url = tp.page_url
    GROUP BY tp.domain_name
  )
  
  SELECT json_agg(
    json_build_object(
      'domain', td.domain_name,
      'total_count', td.total_count,
      'domain_notes', COALESCE(dn.domain_notes, '[]'::json),
      'top_pages', COALESCE(dp.top_pages, '[]'::json)
    ) ORDER BY td.total_count DESC, td.domain_name ASC
  ) INTO result
  FROM top_domains td
  LEFT JOIN domain_latest_notes dn ON dn.domain_name = td.domain_name
  LEFT JOIN domain_pages_json dp ON dp.domain_name = td.domain_name;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;
