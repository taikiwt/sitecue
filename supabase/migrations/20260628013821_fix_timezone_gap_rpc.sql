-- get_notes_by_date の再定義（タイムゾーンを Asia/Tokyo に明示的に補正）
CREATE OR REPLACE FUNCTION "public"."get_notes_by_date"("p_user_id" "uuid", "p_date" "text") RETURNS SETOF "public"."sitecue_notes"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.sitecue_notes
    WHERE user_id = p_user_id AND (timezone('Asia/Tokyo', created_at)::date)::text = p_date
    ORDER BY created_at ASC;
END;
$$;

-- get_drafts_by_date の再定義（タイムゾーンを Asia/Tokyo に明示的に補正）
CREATE OR REPLACE FUNCTION "public"."get_drafts_by_date"("p_user_id" "uuid", "p_date" "text") RETURNS SETOF "public"."sitecue_drafts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.sitecue_drafts
    WHERE user_id = p_user_id AND (timezone('Asia/Tokyo', updated_at)::date)::text = p_date
    ORDER BY updated_at ASC;
END;
$$;
