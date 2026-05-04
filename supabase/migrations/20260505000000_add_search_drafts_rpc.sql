CREATE OR REPLACE FUNCTION "public"."search_drafts"("search_query" "text") RETURNS SETOF "public"."sitecue_drafts"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.sitecue_drafts
  WHERE (content ILIKE '%' || search_query || '%'
     OR title ILIKE '%' || search_query || '%');
END;
$$;

ALTER FUNCTION "public"."search_drafts"("search_query" "text") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."search_drafts"("search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_drafts"("search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_drafts"("search_query" "text") TO "service_role";
