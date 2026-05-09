-- 1. 既存データのクリーンアップ
UPDATE public.sitecue_notes 
SET url_pattern = 'inbox' 
WHERE scope = 'inbox' AND (url_pattern IS NULL OR url_pattern != 'inbox');

-- 2. 自動補完関数の作成
CREATE OR REPLACE FUNCTION public.handle_sitecue_notes_inbox_consistency()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.scope = 'inbox' THEN
        NEW.url_pattern := 'inbox';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. トリガーの適用 (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS sitecue_notes_inbox_consistency_trigger ON public.sitecue_notes;
CREATE TRIGGER sitecue_notes_inbox_consistency_trigger
BEFORE INSERT OR UPDATE ON public.sitecue_notes
FOR EACH ROW EXECUTE FUNCTION public.handle_sitecue_notes_inbox_consistency();
