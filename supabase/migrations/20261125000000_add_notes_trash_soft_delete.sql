-- 1. sitecue_notes に論理削除カラムを追加
ALTER TABLE public.sitecue_notes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS sitecue_notes_deleted_at_idx
  ON public.sitecue_notes USING btree (user_id, deleted_at);

-- 2. 上限チェック関数を更新（アクティブノートのみカウントし、復元時にもチェック）
CREATE OR REPLACE FUNCTION public.check_note_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  user_plan text;
  note_count int;
begin
  IF TG_OP = 'UPDATE' AND NOT (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
    RETURN NEW;
  END IF;

  select plan into user_plan
  from public.sitecue_profiles
  where id = auth.uid();

  if user_plan = 'free' or user_plan is null then
    select count(*) into note_count
    from public.sitecue_notes
    where user_id = auth.uid()
      and deleted_at is null;

    if note_count >= 500 then
      raise exception 'note storage limit reached';
    end if;
  end if;

  return new;
end;
$$;

DROP TRIGGER IF EXISTS on_note_created_check_limit ON public.sitecue_notes;
CREATE TRIGGER on_note_created_check_limit
  BEFORE INSERT OR UPDATE OF deleted_at ON public.sitecue_notes
  FOR EACH ROW EXECUTE FUNCTION public.check_note_limit();

-- 3. 既存 RPC 関数に deleted_at IS NULL 条件を追加
CREATE OR REPLACE FUNCTION public.get_matching_active_note_count(p_domain text, p_exact text) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT count(*)::integer
  FROM public.sitecue_notes
  WHERE user_id = auth.uid()
    AND is_resolved = false
    AND deleted_at IS NULL
    AND ((scope = 'domain' AND url_pattern = p_domain)
      OR (scope = 'exact' AND url_pattern = p_exact));
$$;

CREATE OR REPLACE FUNCTION public.get_matching_notes(p_domain text, p_exact text) RETURNS SETOF public.sitecue_notes
    LANGUAGE plpgsql
    AS $$
begin
  return query
  select * from sitecue_notes
  where deleted_at is null
    and ((scope = 'domain' and url_pattern = p_domain)
      or (scope = 'exact' and url_pattern = p_exact));
end;
$$;

CREATE OR REPLACE FUNCTION public.get_notes_by_date(p_user_id uuid, p_date text) RETURNS SETOF public.sitecue_notes
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.sitecue_notes
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND (timezone('Asia/Tokyo', created_at)::date)::text = p_date
    ORDER BY created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_notes(search_query text) RETURNS SETOF public.sitecue_notes
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.sitecue_notes
  WHERE deleted_at IS NULL
    AND (content ILIKE '%' || search_query || '%'
      OR url_pattern ILIKE '%' || search_query || '%');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_domain_activity(p_user_id uuid, p_limit integer DEFAULT 6) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  result json;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH note_with_domain AS (
    SELECT
      *,
      regexp_replace(url_pattern, '^(?:https?://)?(?:www\.)?([^/]+).*$', '\1') AS domain_name
    FROM public.sitecue_notes
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND scope IN ('domain', 'exact')
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
        json_agg(json_build_object('id', ln.id, 'content', ln.content, 'is_resolved', ln.is_resolved) ORDER BY ln.created_at DESC)
        FILTER (WHERE ln.id IS NOT NULL),
        '[]'::json
      ) AS domain_notes
    FROM top_domains td
    LEFT JOIN LATERAL (
      SELECT id, content, is_resolved, created_at
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
        json_agg(json_build_object('id', lpn.id, 'content', lpn.content, 'is_resolved', lpn.is_resolved) ORDER BY lpn.created_at DESC)
        FILTER (WHERE lpn.id IS NOT NULL),
        '[]'::json
      ) AS page_notes
    FROM top_pages_filtered tp
    LEFT JOIN LATERAL (
      SELECT id, content, is_resolved, created_at
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
$_$;

-- 4. 期限切れゴミ箱ノートの自動物理削除関数（Free: 7日 / Pro: 30日）
CREATE OR REPLACE FUNCTION public.cleanup_expired_trash_notes() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.sitecue_notes n
  USING public.sitecue_profiles p
  WHERE n.user_id = p.id
    AND n.deleted_at IS NOT NULL
    AND (
      (p.plan = 'pro' AND n.deleted_at < now() - interval '30 days')
      OR (p.plan <> 'pro' AND n.deleted_at < now() - interval '7 days')
    );

  DELETE FROM public.sitecue_notes n
  WHERE n.deleted_at IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.sitecue_profiles p WHERE p.id = n.user_id)
    AND n.deleted_at < now() - interval '7 days';
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-expired-trash-notes')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-trash-notes');

    PERFORM cron.schedule(
      'cleanup-expired-trash-notes',
      '0 3 * * *',
      'SELECT public.cleanup_expired_trash_notes();'
    );
  END IF;
END;
$$;
