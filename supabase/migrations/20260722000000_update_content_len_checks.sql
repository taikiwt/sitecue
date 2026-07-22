-- 1. sitecue_notes の CHECK 制約を 30,000 文字（Pro上限）へ引き上げ
ALTER TABLE public.sitecue_notes
  DROP CONSTRAINT IF EXISTS sitecue_notes_content_len_check,
  ADD CONSTRAINT sitecue_notes_content_len_check CHECK (char_length(content) <= 30000);

-- 2. sitecue_diaries の CHECK 制約を 100,000 文字（Pro上限）で新設
ALTER TABLE public.sitecue_diaries
  DROP CONSTRAINT IF EXISTS sitecue_diaries_content_len_check,
  ADD CONSTRAINT sitecue_diaries_content_len_check CHECK (char_length(content) <= 100000);

-- 3. ノートのプラン別動的文字数チェック関数 & トリガー
CREATE OR REPLACE FUNCTION "public"."check_note_content_length"() RETURNS "trigger" AS $$
declare
  user_plan text;
begin
  select plan into user_plan from public.sitecue_profiles where id = auth.uid();
  if (user_plan = 'free' or user_plan is null) and char_length(NEW.content) > 10000 then
    raise exception 'content length exceeds free plan limit (10000 chars)';
  end if;
  return new;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS "on_note_content_length_check" ON "public"."sitecue_notes";
CREATE TRIGGER "on_note_content_length_check"
  BEFORE INSERT OR UPDATE ON "public"."sitecue_notes"
  FOR EACH ROW EXECUTE FUNCTION "public"."check_note_content_length"();

-- 4. 日記のプラン別動的文字数チェック関数 & トリガー
CREATE OR REPLACE FUNCTION "public"."check_diary_content_length"() RETURNS "trigger" AS $$
declare
  user_plan text;
begin
  select plan into user_plan from public.sitecue_profiles where id = auth.uid();
  if (user_plan = 'free' or user_plan is null) and char_length(NEW.content) > 50000 then
    raise exception 'content length exceeds free plan limit (50000 chars)';
  end if;
  return new;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS "on_diary_content_length_check" ON "public"."sitecue_diaries";
CREATE TRIGGER "on_diary_content_length_check"
  BEFORE INSERT OR UPDATE ON "public"."sitecue_diaries"
  FOR EACH ROW EXECUTE FUNCTION "public"."check_diary_content_length"();
