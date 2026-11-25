-- 1. sitecue_drafts に論理削除用カラムとインデックスを追加
ALTER TABLE public.sitecue_drafts
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS sitecue_drafts_deleted_at_idx
ON public.sitecue_drafts USING btree (user_id, deleted_at);

-- 2. check_draft_limit トリガー関数の更新（論理削除済みをカウントから除外、復元時も上限チェック）
CREATE OR REPLACE FUNCTION public.check_draft_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  user_plan text;
  draft_count int;
begin
  IF TG_OP = 'UPDATE' AND NOT (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
    RETURN NEW;
  END IF;

  select plan into user_plan
  from public.sitecue_profiles
  where id = auth.uid();

  if user_plan = 'free' or user_plan is null then
    select count(*) into draft_count
    from public.sitecue_drafts
    where user_id = auth.uid()
      and deleted_at is null;

    if draft_count >= 50 then
      raise exception 'draft storage limit reached';
    end if;
  end if;

  return new;
end;
$$;

DROP TRIGGER IF EXISTS on_draft_created_check_limit ON public.sitecue_drafts;
CREATE TRIGGER on_draft_created_check_limit
  BEFORE INSERT OR UPDATE OF deleted_at ON public.sitecue_drafts
  FOR EACH ROW EXECUTE FUNCTION public.check_draft_limit();

-- 3. 既存 RPC から論理削除済みドラフトを除外
CREATE OR REPLACE FUNCTION public.get_drafts_by_date(p_user_id uuid, p_date text) RETURNS SETOF public.sitecue_drafts
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.sitecue_drafts
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND (timezone('Asia/Tokyo', updated_at)::date)::text = p_date
    ORDER BY updated_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_drafts(search_query text) RETURNS SETOF public.sitecue_drafts
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.sitecue_drafts
  WHERE deleted_at IS NULL
    AND (content ILIKE '%' || search_query || '%'
      OR title ILIKE '%' || search_query || '%');
END;
$$;

-- 4. 期限切れゴミ箱クリーンアップ関数に sitecue_drafts を追加
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

  DELETE FROM public.sitecue_drafts d
  USING public.sitecue_profiles p
  WHERE d.user_id = p.id
    AND d.deleted_at IS NOT NULL
    AND (
      (p.plan = 'pro' AND d.deleted_at < now() - interval '30 days')
      OR (p.plan <> 'pro' AND d.deleted_at < now() - interval '7 days')
    );

  DELETE FROM public.sitecue_drafts d
  WHERE d.deleted_at IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.sitecue_profiles p WHERE p.id = d.user_id)
    AND d.deleted_at < now() - interval '7 days';
END;
$$;
