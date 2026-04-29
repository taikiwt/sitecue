-- 新規: ドラフト用の上限チェック関数
CREATE OR REPLACE FUNCTION "public"."check_draft_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  user_plan text;
  draft_count int;
begin
  select plan into user_plan
  from public.sitecue_profiles
  where id = auth.uid();

  if user_plan = 'free' then
    select count(*) into draft_count
    from public.sitecue_drafts
    where user_id = auth.uid();

    if draft_count >= 50 then
      raise exception 'draft storage limit reached';
    end if;
  end if;

  return new;
end;
$$;

-- 新規: ドラフト用のトリガー
CREATE OR REPLACE TRIGGER "on_draft_created_check_limit" BEFORE INSERT ON "public"."sitecue_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."check_draft_limit"();

-- 更新: 既存のノート用上限チェック関数のエラーメッセージ統一
CREATE OR REPLACE FUNCTION "public"."check_note_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  user_plan text;
  note_count int;
begin
  select plan into user_plan
  from public.sitecue_profiles
  where id = auth.uid();

  if user_plan = 'free' then
    select count(*) into note_count
    from public.sitecue_notes
    where user_id = auth.uid();

    -- Note limit is 500 as per latest migration
    if note_count >= 500 then
      raise exception 'note storage limit reached';
    end if;
  end if;

  return new;
end;
$$;
