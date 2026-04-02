DO $$ 
DECLARE
  target_user_id uuid := 'c3b9c182-b714-4464-80b6-b3417a69b2ba'; -- 例: '11111111-1111-1111-1111-111111111111'
BEGIN
  -- ==========================================
  -- 1. Slide 2: Core Features 用のメモ (github.com)
  -- ==========================================
  INSERT INTO public.sitecue_notes (user_id, url_pattern, scope, note_type, is_pinned, sort_order, content) VALUES
  (target_user_id, 'github.com/taikiwt/sitecue', 'exact', 'info', true, 1, 
   '**"Your notes, right on site."**
Notes linked directly to your current web page.
Free your mind from the burden of note management.'),
  
  (target_user_id, 'github.com/taikiwt/sitecue', 'exact', 'alert', false, 2, 'Create a logo'),
  (target_user_id, 'github.com/taikiwt/sitecue', 'exact', 'alert', false, 3, 'Display the number of notes for the page as a badge on the icon'),
  (target_user_id, 'github.com/taikiwt/sitecue', 'exact', 'idea', false, 4, 'I want pinning and favorite features.'),
  (target_user_id, 'github.com/taikiwt/sitecue', 'exact', 'alert', false, 5, 'Enable Markdown support');

  -- ==========================================
  -- 2. Slide 3: Pro Features 用のメモとリンク (localhost:3000)
  -- ==========================================
  -- メモの挿入 (Markdown Code Block)
  INSERT INTO public.sitecue_notes (user_id, url_pattern, scope, note_type, is_pinned, sort_order, content) VALUES
  (target_user_id, '127.0.0.1:3000', 'domain', 'info', true, 1, 
   '// auth.ts: SupabaseのJWTトークン検証
app.use(''/*'', async (c, next) => {
  const token = c.req.header(''Authorization'')?.replace(''Bearer '', '''');
  if (!token) return c.json({ error: ''Unauthorized'' }, 401);

  // TODO: 次のリリースでトークンのキャッシュ検証を追加
  const user = await verifyToken(token);
  c.set(''user'', user);
  await next();
});');

  -- Quick Linksの挿入
  INSERT INTO public.sitecue_links (user_id, domain, target_url, label, type) VALUES
  (target_user_id, '127.0.0.1:3000', 'https://app.sitecue.app', 'Production environment', 'env'),
  (target_user_id, '127.0.0.1:3000', 'https://github.com/taikiwt/sitecue', 'GitHub Repository', 'related'),
  (target_user_id, '127.0.0.1:3000', 'https://nextjs.org/docs', 'Next.js docs', 'related'),
  (target_user_id, '127.0.0.1:3000', 'https://nerdcave.com/tailwind-cheat-sheet', 'TailwindCSS Cheatsheet', 'related');

END $$;