-- 不要テーブルの削除
DROP TABLE IF EXISTS "public"."sitecue_page_contents";

-- 文字数制限のCHECK制約追加
ALTER TABLE "public"."sitecue_notes" ADD CONSTRAINT "sitecue_notes_content_len_check" CHECK (char_length(content) <= 10000);
ALTER TABLE "public"."sitecue_drafts" ADD CONSTRAINT "sitecue_drafts_content_len_check" CHECK (char_length(content) <= 100000);
ALTER TABLE "public"."sitecue_templates" ADD CONSTRAINT "sitecue_templates_boilerplate_len_check" CHECK (char_length(boilerplate) <= 5000);
ALTER TABLE "public"."sitecue_templates" ADD CONSTRAINT "sitecue_templates_weave_prompt_len_check" CHECK (char_length(weave_prompt) <= 5000);
