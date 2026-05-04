CREATE OR REPLACE FUNCTION "public"."search_notes"("search_query" text) RETURNS SETOF "public"."sitecue_notes"
LANGUAGE "plpgsql"
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.sitecue_notes
  WHERE (content ILIKE '%' || search_query || '%'
     OR url_pattern ILIKE '%' || search_query || '%');
END;
$$;
