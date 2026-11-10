-- デモノートとデモドラフトを安全に一括削除
DELETE FROM public.sitecue_notes
WHERE '__demo_seed__' = ANY(tags)
  AND user_id = (SELECT id FROM auth.users WHERE email = 'claudeslogos@gmail.com');

DELETE FROM public.sitecue_drafts
WHERE '__demo_seed__' = ANY(tags)
  AND user_id = (SELECT id FROM auth.users WHERE email = 'claudeslogos@gmail.com');