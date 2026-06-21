-- 配列要素の文字列長を判定するイミュータブル関数（CHECK制約用）
CREATE OR REPLACE FUNCTION public.check_array_elements_length(arr text[], max_len int) 
RETURNS boolean AS $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY arr LOOP
        IF length(t) > max_len THEN
            RETURN false;
        END IF;
    END LOOP;
    RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- sitecue_diaries テーブル定義
CREATE TABLE IF NOT EXISTS public.sitecue_diaries (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL, -- YYYY-MM-DD プレーン文字列で完全一致判定
    content text DEFAULT '' NOT NULL,
    topics text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, date),
    CONSTRAINT sitecue_diaries_topics_count_check CHECK (cardinality(topics) <= 10),
    CONSTRAINT sitecue_diaries_topics_length_check CHECK (public.check_array_elements_length(topics, 50))
);

ALTER TABLE public.sitecue_diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own diaries" ON public.sitecue_diaries
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 日付SSOT（Timezone Shift排除）で通常Notes/Draftsをその日の素材として一括取得するRPC
CREATE OR REPLACE FUNCTION public.get_notes_by_date(p_user_id uuid, p_date text)
RETURNS SETOF public.sitecue_notes AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.sitecue_notes
    WHERE user_id = p_user_id AND (created_at::date)::text = p_date
    ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_drafts_by_date(p_user_id uuid, p_date text)
RETURNS SETOF public.sitecue_drafts AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.sitecue_drafts
    WHERE user_id = p_user_id AND (updated_at::date)::text = p_date
    ORDER BY updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
