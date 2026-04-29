-- ローカルテスト用: ノートの上限を一時的に5件に変更
CREATE OR REPLACE FUNCTION "public"."check_note_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  user_plan text;
  note_count int;
begin
  select plan into user_plan from public.sitecue_profiles where id = auth.uid();
  if user_plan = 'free' then
    select count(*) into note_count from public.sitecue_notes where user_id = auth.uid();
    if note_count >= 5 then -- テスト用に5件へ引き下げ
      raise exception 'note storage limit reached';
    end if;
  end if;
  return new;
end;
$$;

-- ローカルテスト用: ドラフトの上限を一時的に5件に変更
CREATE OR REPLACE FUNCTION "public"."check_draft_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  user_plan text;
  draft_count int;
begin
  select plan into user_plan from public.sitecue_profiles where id = auth.uid();
  if user_plan = 'free' then
    select count(*) into draft_count from public.sitecue_drafts where user_id = auth.uid();
    if draft_count >= 3 then -- テスト用に3件へ引き下げ
      raise exception 'draft storage limit reached';
    end if;
  end if;
  return new;
end;
$$;