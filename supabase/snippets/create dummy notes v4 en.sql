DO $$
DECLARE
  v_target_email text := 'claudeslogos@gmail.com';
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_target_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for email: %', v_target_email;
  END IF;

  -- ===========================================================================
  -- A. Insert 100 Demo Notes (public.sitecue_notes)
  -- ===========================================================================
  INSERT INTO public.sitecue_notes (
    user_id, url_pattern, scope, note_type, content,
    is_pinned, is_resolved, sort_order, created_at, updated_at, tags
  )
  VALUES
    -- -------------------------------------------------------------------------
    -- 1. github.com (18 items: 2 domain + 16 exact across 3 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'github.com', 'domain', 'info',
$c$# GitHub Workflow & Shortcuts
- Ensure Biome format and lint checks pass before opening a PR
- Reference Issue IDs in commit messages for automated linking$c$,
    true, false, 1.0, now() - interval '1 hour', now() - interval '1 hour', ARRAY['__demo_seed__', 'github', 'workflow']),

    (v_user_id, 'github.com', 'domain', 'info',
$c$# Cross-Repo Search Query
Use `org:taikiwt path:package.json "wxt"` to audit extension dependencies across all repositories.$c$,
    false, false, 2.0, now() - interval '2 hours', now() - interval '2 hours', ARRAY['__demo_seed__', 'github', 'tips']),

    -- github.com/taikiwt/sitecue/issues (7 items)
    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'alert',
$c$# Fine-Tune Cache Revalidation Scope
Call `revalidatePath('/notes', 'page')` after Server Actions to avoid redundant root layout re-renders.$c$,
    true, false, 3.0, now() - interval '3 hours', now() - interval '3 hours', ARRAY['__demo_seed__', 'sitecue', 'nextjs']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'idea',
$c$# 3-Pane Keyboard Navigation Shortcuts
- `j` / `k` to move selection up and down
- `/` to immediately focus the search input$c$,
    false, false, 4.0, now() - interval '5 hours', now() - interval '5 hours', ARRAY['__demo_seed__', 'sitecue', 'ux']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'alert',
$c$# Prevent Tab Wrapping on Narrow Side Panels
Quick Panel tab icons wrap when panel width is under 320px. Apply `flex-shrink-0` to fix.$c$,
    false, false, 5.0, now() - interval '1 day 2 hours', now() - interval '1 day 2 hours', ARRAY['__demo_seed__', 'css', 'bug']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'info',
$c$# 3-Marker Color Tokens
- Info: `#38BDF8`
- Alert: `#F87171`
- Idea: `#FBBF24`$c$,
    false, true, 6.0, now() - interval '2 days 4 hours', now() - interval '2 days 4 hours', ARRAY['__demo_seed__', 'design', 'ui']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'idea',
$c$# One-Click Scratchpad to Daily Diary
Add action button to append temporary scratchpad text to today's diary with an automatic timestamp.$c$,
    false, false, 7.0, now() - interval '3 days 6 hours', now() - interval '3 days 6 hours', ARRAY['__demo_seed__', 'diary', 'feature']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'alert',
$c$# Guard Against IME Enter Submission
Check `e.nativeEvent.isComposing` in keydown handler so IME candidate confirmation does not submit the form.$c$,
    false, true, 8.0, now() - interval '5 days', now() - interval '5 days', ARRAY['__demo_seed__', 'ime', 'linux']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'info',
$c$# Smooth Task Resolve Transition
Animate strikethrough and `opacity: 0.6` over 150ms when marking a note as resolved.$c$,
    false, true, 9.0, now() - interval '7 days', now() - interval '7 days', ARRAY['__demo_seed__', 'ui', 'animation']),

    -- github.com/taikiwt/arrowmind/issues (5 items)
    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'idea',
$c$# Spiral Overview Geometry Calculation
Isolate dynamic angle step and radius decay formulas in `spiralGeometry.ts` to prevent node collisions.$c$,
    false, false, 10.0, now() - interval '8 hours', now() - interval '8 hours', ARRAY['__demo_seed__', 'arrowmind', 'math']),

    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'info',
$c$# 0ms Optimistic UI Updates
Update local canvas state immediately when adding or editing nodes without waiting for server round-trip.$c$,
    false, false, 11.0, now() - interval '1 day 10 hours', now() - interval '1 day 10 hours', ARRAY['__demo_seed__', 'arrowmind', 'ux']),

    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'alert',
$c$# Enforce 150-Line File Limit in CI
Split large canvas rendering components into dedicated custom hooks and pure geometry helpers.$c$,
    false, true, 12.0, now() - interval '3 days 2 hours', now() - interval '3 days 2 hours', ARRAY['__demo_seed__', 'architecture', 'ci']),

    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'idea',
$c$# Paper-Feed Focus Mode
Keep only the immediate parent node and active input centered in the viewport to eliminate visual clutter.$c$,
    false, false, 13.0, now() - interval '6 days', now() - interval '6 days', ARRAY['__demo_seed__', 'arrowmind', 'ui']),

    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'info',
$c$# End-to-End Type Safety with Hono RPC
Share API route types directly between Hono backend and Next.js frontend client.$c$,
    false, true, 14.0, now() - interval '9 days', now() - interval '9 days', ARRAY['__demo_seed__', 'hono', 'typescript']),

    -- github.com/taikiwt/sitecue/pulls (4 items)
    (v_user_id, 'github.com/taikiwt/sitecue/pulls', 'exact', 'info',
$c$# WXT v0.19 Upgrade Merged
Verified Manifest V3 `side_panel` configuration and type-safe background service worker messaging.$c$,
    false, true, 15.0, now() - interval '12 hours', now() - interval '12 hours', ARRAY['__demo_seed__', 'wxt', 'pr']),

    (v_user_id, 'github.com/taikiwt/sitecue/pulls', 'exact', 'info',
$c$# Supabase Session Persistence Adapter
Implemented token auto-refresh backed by `chrome.storage.local` for seamless extension auth.$c$,
    false, true, 16.0, now() - interval '2 days 12 hours', now() - interval '2 days 12 hours', ARRAY['__demo_seed__', 'supabase', 'auth']),

    (v_user_id, 'github.com/taikiwt/sitecue/pulls', 'exact', 'alert',
$c$# Optimize CodeMirror Bundle Size
Lazy-load language syntax packages and restrict initial bundle to core Markdown support.$c$,
    false, true, 17.0, now() - interval '4 days 8 hours', now() - interval '4 days 8 hours', ARRAY['__demo_seed__', 'bundle', 'perf']),

    (v_user_id, 'github.com/taikiwt/sitecue/pulls', 'exact', 'info',
$c$# Unit Tests for Polar Webhook Handler
Added test coverage for signature verification failure and subscription status upgrades.$c$,
    false, true, 18.0, now() - interval '8 days', now() - interval '8 days', ARRAY['__demo_seed__', 'polar', 'test']),

    -- -------------------------------------------------------------------------
    -- 2. nextjs.org (10 items: 2 domain + 8 exact across 2 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'nextjs.org', 'domain', 'info',
$c$# Next.js App Router Conventions
- Default to Server Components for data fetching
- Push `'use client'` boundaries down to interactive leaf components$c$,
    true, false, 1.0, now() - interval '4 hours', now() - interval '4 hours', ARRAY['__demo_seed__', 'nextjs', 'architecture']),

    (v_user_id, 'nextjs.org', 'domain', 'info',
$c$# Mounting Hono in Route Handlers
Export Hono app handlers inside `/api/[[...route]]/route.ts` for unified edge routing.$c$,
    false, false, 2.0, now() - interval '1 day 4 hours', now() - interval '1 day 4 hours', ARRAY['__demo_seed__', 'nextjs', 'hono']),

    -- nextjs.org/docs/app/building-your-application/caching (4 items)
    (v_user_id, 'nextjs.org/docs/app/building-your-application/caching', 'exact', 'alert',
$c$# Data Cache vs Full Route Cache
Basecamp dashboard requires real-time note updates; explicitly set `export const dynamic = 'force-dynamic'`.$c$,
    false, false, 3.0, now() - interval '6 hours', now() - interval '6 hours', ARRAY['__demo_seed__', 'nextjs', 'cache']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/caching', 'exact', 'info',
$c$# Router Cache Invalidation Behavior
Calling `revalidatePath` inside a Server Action automatically invalidates the client-side Router Cache.$c$,
    false, true, 4.0, now() - interval '2 days 2 hours', now() - interval '2 days 2 hours', ARRAY['__demo_seed__', 'nextjs', 'cache']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/caching', 'exact', 'idea',
$c$# Evaluate unstable_cache for Heavy Aggregations
Consider short-lived caching (60s) for historical domain statistics if query load increases.$c$,
    false, false, 5.0, now() - interval '4 days 10 hours', now() - interval '4 days 10 hours', ARRAY['__demo_seed__', 'perf', 'cache']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/caching', 'exact', 'info',
$c$# Fetch Cache Options Reference
Confirmed behavior of `cache: 'no-store'` vs `next: { revalidate: 0 }` in App Router.$c$,
    false, true, 6.0, now() - interval '9 days 4 hours', now() - interval '9 days 4 hours', ARRAY['__demo_seed__', 'nextjs', 'docs']),

    -- nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations (4 items)
    (v_user_id, 'nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 'exact', 'info',
$c$# Structured Error Handling with useActionState
Return `{ success: false, error: '...' }` objects instead of throwing raw exceptions to render clean toast alerts.$c$,
    false, false, 7.0, now() - interval '1 day 8 hours', now() - interval '1 day 8 hours', ARRAY['__demo_seed__', 'nextjs', 'forms']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 'exact', 'idea',
$c$# Instant Note Insertion via useOptimistic
Prepend new notes to the UI list immediately before the database mutation completes.$c$,
    false, false, 8.0, now() - interval '3 days 8 hours', now() - interval '3 days 8 hours', ARRAY['__demo_seed__', 'optimistic-ui', 'ux']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 'exact', 'alert',
$c$# Enforce Auth Verification in Every Action
Treat Server Actions as public endpoints; always validate `supabase.auth.getUser()` at the start of each function.$c$,
    false, true, 9.0, now() - interval '6 days 6 hours', now() - interval '6 days 6 hours', ARRAY['__demo_seed__', 'security', 'auth']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 'exact', 'info',
$c$# Keyboard Submit Shortcut
Trigger `form.requestSubmit()` on `Cmd + Enter` across all note and draft editors.$c$,
    false, true, 10.0, now() - interval '11 days', now() - interval '11 days', ARRAY['__demo_seed__', 'ux', 'shortcut']),

    -- -------------------------------------------------------------------------
    -- 3. notion.so (9 items: 2 domain + 7 exact across 2 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'notion.so', 'domain', 'info',
$c$# Role Separation: Notion vs sitecue
- Notion: Long-term archival specs and static documentation
- sitecue: Active in-browser field notes, URL-linked tasks, and writing drafts$c$,
    false, false, 1.0, now() - interval '7 hours', now() - interval '7 hours', ARRAY['__demo_seed__', 'notion', 'workflow']),

    (v_user_id, 'notion.so', 'domain', 'info',
$c$# Zero Management Philosophy
Eliminate manual folder hierarchies and tag maintenance; let the URL and domain act as automatic categories.$c$,
    false, false, 2.0, now() - interval '2 days', now() - interval '2 days', ARRAY['__demo_seed__', 'philosophy', 'design']),

    -- notion.so/sitecue-explanation-draft (4 items)
    (v_user_id, 'notion.so/sitecue-explanation-draft', 'exact', 'idea',
$c$# Landing Page Structure Refinement
Drop flashy marketing slogans. Show real UI screenshots and clearly explain how the Extension and Web App work together.$c$,
    false, false, 3.0, now() - interval '9 hours', now() - interval '9 hours', ARRAY['__demo_seed__', 'lp', 'copy']),

    (v_user_id, 'notion.so/sitecue-explanation-draft', 'exact', 'info',
$c$# Clarify Core Target Audience
Tailor examples for developers, researchers, and writers who spend their entire workday inside the browser.$c$,
    false, false, 4.0, now() - interval '1 day 14 hours', now() - interval '1 day 14 hours', ARRAY['__demo_seed__', 'marketing', 'target']),

    (v_user_id, 'notion.so/sitecue-explanation-draft', 'exact', 'alert',
$c$# Consistent Screenshot Aspect Ratios
Capture all product screenshots at uniform scaling and dark theme contrast for the landing page grid.$c$,
    false, false, 5.0, now() - interval '3 days 12 hours', now() - interval '3 days 12 hours', ARRAY['__demo_seed__', 'assets', 'lp']),

    (v_user_id, 'notion.so/sitecue-explanation-draft', 'exact', 'info',
$c$# Inverse Approach to Web Clippers
Instead of clipping pages into a separate app and forgetting them, attach notes directly to the live website itself.$c$,
    false, true, 6.0, now() - interval '6 days 10 hours', now() - interval '6 days 10 hours', ARRAY['__demo_seed__', 'concept', 'positioning']),

    -- notion.so/Qiita-Zenn-note-drafts (3 items)
    (v_user_id, 'notion.so/Qiita-Zenn-note-drafts', 'exact', 'idea',
$c$# 3-Part Technical Article Template
1. The workflow problem and friction point
2. Architecture decisions and code implementation
3. Lessons learned in production$c$,
    false, false, 7.0, now() - interval '1 day 18 hours', now() - interval '1 day 18 hours', ARRAY['__demo_seed__', 'writing', 'template']),

    (v_user_id, 'notion.so/Qiita-Zenn-note-drafts', 'exact', 'info',
$c$# Tailoring Content by Platform
- Technical deep dives: Architecture and stack trade-offs
- Short posts: Quick tips, UI previews, and release updates$c$,
    false, true, 8.0, now() - interval '4 days 16 hours', now() - interval '4 days 16 hours', ARRAY['__demo_seed__', 'zenn', 'qiita']),

    (v_user_id, 'notion.so/Qiita-Zenn-note-drafts', 'exact', 'idea',
$c$# Upcoming Blog Post Topic
"Why Bookmarked Articles Become a Digital Graveyard—and How URL-Anchored Notes Solved It"$c$,
    false, false, 9.0, now() - interval '8 days 6 hours', now() - interval '8 days 6 hours', ARRAY['__demo_seed__', 'blog', 'idea']),

    -- -------------------------------------------------------------------------
    -- 4. chromewebstore.google.com (8 items: 2 domain + 6 exact across 2 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'chromewebstore.google.com', 'domain', 'info',
$c$# Chrome Web Store Publishing Checklist
- Request only minimal required permissions
- Keep privacy practices disclosure strictly aligned with the privacy policy$c$,
    true, false, 1.0, now() - interval '10 hours', now() - interval '10 hours', ARRAY['__demo_seed__', 'cws', 'release']),

    (v_user_id, 'chromewebstore.google.com', 'domain', 'info',
$c$# Store Listing Analytics
Monitor weekly store impressions and install conversion rates after updating screenshots.$c$,
    false, false, 2.0, now() - interval '3 days', now() - interval '3 days', ARRAY['__demo_seed__', 'cws', 'analytics']),

    -- chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak (4 items)
    (v_user_id, 'chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak', 'exact', 'info',
$c$# Updated English & Japanese Store Descriptions
Rewrote copy in plain language explaining both the Side Panel Extension and the Basecamp Web App.$c$,
    false, true, 3.0, now() - interval '11 hours', now() - interval '11 hours', ARRAY['__demo_seed__', 'cws', 'copy']),

    (v_user_id, 'chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak', 'exact', 'alert',
$c$# Refresh 1280x800 Promotional Screenshots
Include clear captures of URL-linked notes, Quick Panel (Command snippets & Links), and Studio drafting.$c$,
    false, false, 4.0, now() - interval '1 day 20 hours', now() - interval '1 day 20 hours', ARRAY['__demo_seed__', 'cws', 'assets']),

    (v_user_id, 'chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak', 'exact', 'idea',
$c$# Highlight Concrete Use Cases in Captions
Show real examples: saving repo commands on GitHub, logging research notes on docs, and drafting posts in Studio.$c$,
    false, false, 5.0, now() - interval '4 days 4 hours', now() - interval '4 days 4 hours', ARRAY['__demo_seed__', 'cws', 'ux']),

    (v_user_id, 'chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak', 'exact', 'info',
$c$# Promotional Tile Assets Verified
Checked 440x280 and 920x680 marquee banners for crisp typography and dark background contrast.$c$,
    false, true, 6.0, now() - interval '7 days 12 hours', now() - interval '7 days 12 hours', ARRAY['__demo_seed__', 'cws', 'design']),

    -- chromewebstore.google.com/category/extensions/productivity (2 items)
    (v_user_id, 'chromewebstore.google.com/category/extensions/productivity', 'exact', 'info',
$c$# Productivity Category Research
Most note extensions are isolated sticky notes. Combining automatic URL recall with a full web writing studio stands out clearly.$c$,
    false, false, 7.0, now() - interval '5 days 8 hours', now() - interval '5 days 8 hours', ARRAY['__demo_seed__', 'research', 'competitor']),

    (v_user_id, 'chromewebstore.google.com/category/extensions/productivity', 'exact', 'idea',
$c$# Store Search Keyword Optimization
Naturally incorporate `side panel notes`, `url note taking`, and `markdown browser editor` into the overview.$c$,
    false, true, 8.0, now() - interval '10 days', now() - interval '10 days', ARRAY['__demo_seed__', 'seo', 'cws']),

    -- -------------------------------------------------------------------------
    -- 5. supabase.com (8 items: 2 domain + 6 exact across 2 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'supabase.com', 'domain', 'info',
$c$# Supabase Migration Workflow
- Local reset: `bunx supabase db reset`
- Audit RLS policies before pushing schema changes to production$c$,
    true, false, 1.0, now() - interval '5 hours', now() - interval '5 hours', ARRAY['__demo_seed__', 'supabase', 'ops']),

    (v_user_id, 'supabase.com', 'domain', 'info',
$c$# Direct Client-to-Supabase Architecture
The Chrome Extension communicates directly with Supabase under RLS protection for zero-hop latency.$c$,
    false, false, 2.0, now() - interval '2 days 6 hours', now() - interval '2 days 6 hours', ARRAY['__demo_seed__', 'supabase', 'architecture']),

    -- supabase.com/docs/guides/auth/row-level-security (3 items)
    (v_user_id, 'supabase.com/docs/guides/auth/row-level-security', 'exact', 'alert',
$c$# Index Backing for RLS Policies
Verified B-tree index on `sitecue_notes(user_id)` so `auth.uid() = user_id` checks execute without sequential scans.$c$,
    false, false, 3.0, now() - interval '13 hours', now() - interval '13 hours', ARRAY['__demo_seed__', 'supabase', 'rls']),

    (v_user_id, 'supabase.com/docs/guides/auth/row-level-security', 'exact', 'info',
$c$# Plan Limit Triggers Verified
Confirmed `check_note_limit` (500 notes) and `check_draft_limit` (50 drafts) triggers enforce free tier quotas accurately.$c$,
    false, true, 4.0, now() - interval '3 days 16 hours', now() - interval '3 days 16 hours', ARRAY['__demo_seed__', 'postgres', 'trigger']),

    (v_user_id, 'supabase.com/docs/guides/auth/row-level-security', 'exact', 'info',
$c$# Access Guard in get_dashboard_domain_activity
Verified that the RPC function explicitly checks `auth.uid() <> p_user_id` to prevent cross-user queries.$c$,
    false, true, 5.0, now() - interval '8 days 2 hours', now() - interval '8 days 2 hours', ARRAY['__demo_seed__', 'rpc', 'security']),

    -- supabase.com/docs/guides/database/postgres/indexes (3 items)
    (v_user_id, 'supabase.com/docs/guides/database/postgres/indexes', 'exact', 'info',
$c$# GIN Index for Tag Array Filtering
Use GIN indexing on the `tags` column to keep tag filtering instantaneous as note volume grows.$c$,
    false, false, 6.0, now() - interval '1 day 22 hours', now() - interval '1 day 22 hours', ARRAY['__demo_seed__', 'postgres', 'index']),

    (v_user_id, 'supabase.com/docs/guides/database/postgres/indexes', 'exact', 'idea',
$c$# Trigram Index (pg_trgm) for Fast Text Search
Evaluate `pg_trgm` GIN index to accelerate `ILIKE '%query%'` searches across note contents.$c$,
    false, false, 7.0, now() - interval '5 days 12 hours', now() - interval '5 days 12 hours', ARRAY['__demo_seed__', 'search', 'perf']),

    (v_user_id, 'supabase.com/docs/guides/database/postgres/indexes', 'exact', 'info',
$c$# URL Pattern Lookup Performance
Confirmed via `EXPLAIN ANALYZE` that `sitecue_notes_url_idx` serves exact URL lookups in sub-millisecond time.$c$,
    false, true, 8.0, now() - interval '12 days', now() - interval '12 days', ARRAY['__demo_seed__', 'sql', 'perf']),

    -- -------------------------------------------------------------------------
    -- 6. zenn.dev (8 items: 2 domain + 6 exact across 2 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'zenn.dev', 'domain', 'info',
$c$# Technical Writing Workflow
1. Capture quick notes on documentation and GitHub while browsing
2. Open Basecamp Studio and pull collected notes from Global Materials
3. Refine Markdown draft and publish$c$,
    false, false, 1.0, now() - interval '6 hours', now() - interval '6 hours', ARRAY['__demo_seed__', 'zenn', 'workflow']),

    (v_user_id, 'zenn.dev', 'domain', 'idea',
$c$# Article Backlog
- Building a Manifest V3 Side Panel Extension with WXT and React
- Integrating Polar.sh (Merchant of Record) with Supabase Webhooks$c$,
    false, false, 2.0, now() - interval '2 days 8 hours', now() - interval '2 days 8 hours', ARRAY['__demo_seed__', 'zenn', 'ideas']),

    -- zenn.dev/taikiwt/articles/sitecue-architecture (3 items)
    (v_user_id, 'zenn.dev/taikiwt/articles/sitecue-architecture', 'exact', 'info',
$c$# Article Outline: Field Companion + Home Base Architecture
Explain why pairing a lightweight browser side panel with a dedicated Next.js web studio creates a complete workflow.$c$,
    false, false, 3.0, now() - interval '14 hours', now() - interval '14 hours', ARRAY['__demo_seed__', 'article', 'architecture']),

    (v_user_id, 'zenn.dev/taikiwt/articles/sitecue-architecture', 'exact', 'idea',
$c$# Add Architecture Diagram
Create an Excalidraw diagram illustrating how URL-anchored notes automatically group by domain in Basecamp.$c$,
    false, false, 4.0, now() - interval '3 days 4 hours', now() - interval '3 days 4 hours', ARRAY['__demo_seed__', 'diagram', 'excalidraw']),

    (v_user_id, 'zenn.dev/taikiwt/articles/sitecue-architecture', 'exact', 'info',
$c$# Opening Hook
Start with the everyday frustration of wondering which note app to open and losing focus mid-task.$c$,
    false, true, 5.0, now() - interval '6 days 14 hours', now() - interval '6 days 14 hours', ARRAY['__demo_seed__', 'writing', 'intro']),

    -- zenn.dev/topics/chrome-extension (3 items)
    (v_user_id, 'zenn.dev/topics/chrome-extension', 'exact', 'info',
$c$# Manifest V3 Side Panel Advantages
Unlike traditional popups that close on click, native Side Panels stay open alongside the active tab while navigating.$c$,
    false, false, 6.0, now() - interval '2 days 16 hours', now() - interval '2 days 16 hours', ARRAY['__demo_seed__', 'extension', 'mv3']),

    (v_user_id, 'zenn.dev/topics/chrome-extension', 'exact', 'alert',
$c$# Zero Host Page CSS Collisions
Because sitecue runs inside the browser's isolated Side Panel container, it never breaks or slows down host web pages.$c$,
    false, true, 7.0, now() - interval '5 days 16 hours', now() - interval '5 days 16 hours', ARRAY['__demo_seed__', 'css', 'sidepanel']),

    (v_user_id, 'zenn.dev/topics/chrome-extension', 'exact', 'info',
$c$# Developer Experience with WXT
Fast Vite HMR and automatic manifest generation significantly reduce extension boilerplate.$c$,
    false, true, 8.0, now() - interval '10 days 8 hours', now() - interval '10 days 8 hours', ARRAY['__demo_seed__', 'wxt', 'vite']),

    -- -------------------------------------------------------------------------
    -- 7. x.com (7 items: 2 domain + 5 exact across 2 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'x.com', 'domain', 'info',
$c$# Social Sharing Guidelines
- Pair every feature update with a clean UI screenshot or short video clip
- Draft and check character counts in Studio before posting$c$,
    false, false, 1.0, now() - interval '8 hours', now() - interval '8 hours', ARRAY['__demo_seed__', 'x', 'sns']),

    (v_user_id, 'x.com', 'domain', 'idea',
$c$# Pinned Post Summary
"Building sitecue: a side panel Chrome extension for leaving notes directly on any URL, paired with a web app for reviewing logs and writing drafts."$c$,
    false, false, 2.0, now() - interval '3 days 10 hours', now() - interval '3 days 10 hours', ARRAY['__demo_seed__', 'copy', 'profile']),

    -- x.com/taikiwt/status/185490123456 (3 items)
    (v_user_id, 'x.com/taikiwt/status/185490123456', 'exact', 'info',
$c$# User Feedback on Quick Panel
Users highlighted that keeping multi-line CLI commands and staging links right beside the tab saves constant context switching.$c$,
    false, false, 3.0, now() - interval '16 hours', now() - interval '16 hours', ARRAY['__demo_seed__', 'feedback', 'lp']),

    (v_user_id, 'x.com/taikiwt/status/185490123456', 'exact', 'idea',
$c$# Short Demo Video Script
Show a 3-step loop: 1. Write note on a doc page -> 2. Revisit URL later -> 3. Badge lights up and note appears automatically.$c$,
    false, false, 4.0, now() - interval '2 days 18 hours', now() - interval '2 days 18 hours', ARRAY['__demo_seed__', 'video', 'demo']),

    (v_user_id, 'x.com/taikiwt/status/185490123456', 'exact', 'info',
$c$# Release Post Tags
Include `#buildinpublic`, `#indiedev`, and `#chromeextension` on major milestone updates.$c$,
    false, true, 5.0, now() - interval '6 days 18 hours', now() - interval '6 days 18 hours', ARRAY['__demo_seed__', 'marketing', 'tags']),

    -- x.com/i/bookmarks (2 items)
    (v_user_id, 'x.com/i/bookmarks', 'exact', 'info',
$c$# Dark UI Reference Bookmarks
Subtle 1px borders (`#2E2E38`) against deep charcoal backgrounds (`#15151A`) for distraction-free reading.$c$,
    false, false, 6.0, now() - interval '4 days 12 hours', now() - interval '4 days 12 hours', ARRAY['__demo_seed__', 'ui', 'design']),

    (v_user_id, 'x.com/i/bookmarks', 'exact', 'info',
$c$# Launch Directory Checklist
Saved thread covering submission requirements for AlternativeTo, Product Hunt, and Chrome extension directories.$c$,
    false, true, 7.0, now() - interval '9 days 12 hours', now() - interval '9 days 12 hours', ARRAY['__demo_seed__', 'directory', 'seo']),

    -- -------------------------------------------------------------------------
    -- 8. polar.sh (6 items: 2 domain + 4 exact across 2 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'polar.sh', 'domain', 'info',
$c$# Polar.sh Subscription Configuration
- Pro Monthly: $5/month | Pro Yearly: $48/year
- Merchant of Record handles global tax and VAT compliance automatically$c$,
    true, false, 1.0, now() - interval '12 hours', now() - interval '12 hours', ARRAY['__demo_seed__', 'polar', 'billing']),

    (v_user_id, 'polar.sh', 'domain', 'info',
$c$# Production Environment Variables Verified
Confirmed live `POLAR_WEBHOOK_SECRET` and checkout redirect URLs are active in production.$c$,
    false, true, 2.0, now() - interval '4 days', now() - interval '4 days', ARRAY['__demo_seed__', 'polar', 'env']),

    -- polar.sh/docs/api-reference/checkouts/create (2 items)
    (v_user_id, 'polar.sh/docs/api-reference/checkouts/create', 'exact', 'alert',
$c$# Pass User Context to Checkout Session
Always include `customer_email` and user ID metadata when creating checkout links so webhooks map cleanly to `sitecue_profiles`.$c$,
    false, false, 3.0, now() - interval '1 day 6 hours', now() - interval '1 day 6 hours', ARRAY['__demo_seed__', 'polar', 'checkout']),

    (v_user_id, 'polar.sh/docs/api-reference/checkouts/create', 'exact', 'info',
$c$# End-to-End Sandbox Verification
Tested checkout completion via ngrok tunnel and verified instant upgrade to `plan = 'pro'`.$c$,
    false, true, 4.0, now() - interval '5 days 4 hours', now() - interval '5 days 4 hours', ARRAY['__demo_seed__', 'sandbox', 'ngrok']),

    -- polar.sh/docs/webhooks/order-created (2 items)
    (v_user_id, 'polar.sh/docs/webhooks/order-created', 'exact', 'info',
$c$# Idempotent Webhook Processing
Ensure repeated webhook deliveries safely upsert `polar_subscription_id` without side effects.$c$,
    false, true, 5.0, now() - interval '3 days 18 hours', now() - interval '3 days 18 hours', ARRAY['__demo_seed__', 'webhook', 'idempotency']),

    (v_user_id, 'polar.sh/docs/webhooks/order-created', 'exact', 'info',
$c$# Subscription Cancellation Lifecycle
Keep Pro features active until the end of the billing period; downgrade to `free` only upon `subscription.revoked`.$c$,
    false, true, 6.0, now() - interval '8 days 14 hours', now() - interval '8 days 14 hours', ARRAY['__demo_seed__', 'subscription', 'lifecycle']),

    -- -------------------------------------------------------------------------
    -- 9. claude.ai (6 items: 2 domain + 4 exact across 2 pages)
    -- -------------------------------------------------------------------------
    (v_user_id, 'claude.ai', 'domain', 'info',
$c$# Capturing AI Brainstorming Takeaways
Instead of losing good code snippets inside long chat histories, save final takeaways directly into the sitecue side panel.$c$,
    false, false, 1.0, now() - interval '15 hours', now() - interval '15 hours', ARRAY['__demo_seed__', 'claude', 'workflow']),

    (v_user_id, 'claude.ai', 'domain', 'info',
$c$# Reusable Prompt Templates
Keep frequently used architecture review prompts in the Quick Panel Scratchpad for one-click pasting.$c$,
    false, false, 2.0, now() - interval '4 days 2 hours', now() - interval '4 days 2 hours', ARRAY['__demo_seed__', 'prompt', 'scratchpad']),

    -- claude.ai/chat/26bd318d-da45-420a-b59e-727cf546ef8a (2 items)
    (v_user_id, 'claude.ai/chat/26bd318d-da45-420a-b59e-727cf546ef8a', 'exact', 'alert',
$c$# Optimize Tab Switching Performance
Memoize inactive tab trees in the side panel to keep tab switching instant.$c$,
    false, false, 3.0, now() - interval '1 day 12 hours', now() - interval '1 day 12 hours', ARRAY['__demo_seed__', 'react', 'perf']),

    (v_user_id, 'claude.ai/chat/26bd318d-da45-420a-b59e-727cf546ef8a', 'exact', 'info',
$c$# PWA Asset Caching Strategy
Reviewed service worker caching rules for fast initial dashboard loads.$c$,
    false, true, 4.0, now() - interval '5 days 20 hours', now() - interval '5 days 20 hours', ARRAY['__demo_seed__', 'pwa', 'cache']),

    -- claude.ai/chat/a4196da0-0099-418f-95e8-41ecce539bc6 (2 items)
    (v_user_id, 'claude.ai/chat/a4196da0-0099-418f-95e8-41ecce539bc6', 'exact', 'idea',
$c$# Domain Extraction Regex in PostgreSQL
Use `regexp_replace(url_pattern, '^(?:https?://)?(?:www\.)?([^/]+).*$', '\1')` to group notes cleanly by hostname.$c$,
    false, true, 5.0, now() - interval '2 days 20 hours', now() - interval '2 days 20 hours', ARRAY['__demo_seed__', 'sql', 'regex']),

    (v_user_id, 'claude.ai/chat/a4196da0-0099-418f-95e8-41ecce539bc6', 'exact', 'info',
$c$# Top-N Per Group via LATERAL JOIN
Fetch the 2 most recent notes per domain and per page efficiently inside a single RPC call.$c$,
    false, true, 6.0, now() - interval '7 days 18 hours', now() - interval '7 days 18 hours', ARRAY['__demo_seed__', 'postgres', 'json']),

    -- -------------------------------------------------------------------------
    -- 10. tailwindcss.com (4 items: 1 domain + 3 exact on 1 page)
    -- -------------------------------------------------------------------------
    (v_user_id, 'tailwindcss.com', 'domain', 'info',
$c$# Base Dark Theme Palette
Background `#15151A`, elevated surface `#1E1E26`, and subtle border `#2E2E38` for high text legibility.$c$,
    false, false, 1.0, now() - interval '18 hours', now() - interval '18 hours', ARRAY['__demo_seed__', 'tailwind', 'design']),

    (v_user_id, 'tailwindcss.com/docs/v4-beta', 'exact', 'alert',
$c$# Tailwind CSS v4 @theme Directive
Migrate custom color tokens from `tailwind.config.js` directly into CSS variables under `@theme`.$c$,
    false, false, 2.0, now() - interval '2 days 10 hours', now() - interval '2 days 10 hours', ARRAY['__demo_seed__', 'tailwind', 'v4']),

    (v_user_id, 'tailwindcss.com/docs/v4-beta', 'exact', 'info',
$c$# Responsive Side Panel via @container Queries
Adapt note card layout dynamically based on the side panel container width rather than viewport width.$c$,
    false, true, 3.0, now() - interval '5 days 6 hours', now() - interval '5 days 6 hours', ARRAY['__demo_seed__', 'css', 'container']),

    (v_user_id, 'tailwindcss.com/docs/v4-beta', 'exact', 'info',
$c$# Markdown Preview Typography
Tuned `prose-invert` code block padding and heading margins in the Studio preview pane.$c$,
    false, true, 4.0, now() - interval '9 days 8 hours', now() - interval '9 days 8 hours', ARRAY['__demo_seed__', 'markdown', 'typography']),

    -- -------------------------------------------------------------------------
    -- 11. cloudflare.com (4 items: 1 domain + 3 exact on 1 page)
    -- -------------------------------------------------------------------------
    (v_user_id, 'cloudflare.com', 'domain', 'info',
$c$# Domain & Routing Overview
- `sitecue.app`: Astro landing page on Cloudflare Workers Static Assets
- `support@sitecue.app`: Forwarded via Cloudflare Email Routing$c$,
    false, false, 1.0, now() - interval '20 hours', now() - interval '20 hours', ARRAY['__demo_seed__', 'cloudflare', 'infra']),

    (v_user_id, 'cloudflare.com/workers/configuration/routing', 'exact', 'alert',
$c$# Keep App Subdomain CNAME as DNS Only
Set `app.sitecue.app` proxy status to DNS Only (grey cloud) to avoid SSL renewal conflicts.$c$,
    false, false, 2.0, now() - interval '3 days 14 hours', now() - interval '3 days 14 hours', ARRAY['__demo_seed__', 'dns', 'ssl']),

    (v_user_id, 'cloudflare.com/workers/configuration/routing', 'exact', 'info',
$c$# Static Asset Cache Headers
Verified `Cache-Control: public, max-age=31536000, immutable` on hashed asset bundles.$c$,
    false, true, 3.0, now() - interval '6 days 20 hours', now() - interval '6 days 20 hours', ARRAY['__demo_seed__', 'workers', 'cache']),

    (v_user_id, 'cloudflare.com/workers/configuration/routing', 'exact', 'info',
$c$# SPF & DKIM Records Active
Verified DNS authentication records for reliable support email delivery.$c$,
    false, true, 4.0, now() - interval '11 days 12 hours', now() - interval '11 days 12 hours', ARRAY['__demo_seed__', 'email', 'dns']),

    -- -------------------------------------------------------------------------
    -- 12. biomejs.dev (3 items: 1 domain + 2 exact on 1 page)
    -- -------------------------------------------------------------------------
    (v_user_id, 'biomejs.dev', 'domain', 'info',
$c$# Unified Format & Lint Command
Run `bunx @biomejs/biome check --write .` before committing to format code and sort imports in one pass.$c$,
    false, false, 1.0, now() - interval '1 day 16 hours', now() - interval '1 day 16 hours', ARRAY['__demo_seed__', 'biome', 'linter']),

    (v_user_id, 'biomejs.dev/linter/rules', 'exact', 'alert',
$c$# Disallow Explicit Any
Enforce strict discriminated union types for all extension message payloads.$c$,
    false, true, 2.0, now() - interval '4 days 20 hours', now() - interval '4 days 20 hours', ARRAY['__demo_seed__', 'typescript', 'biome']),

    (v_user_id, 'biomejs.dev/linter/rules', 'exact', 'info',
$c$# Hook Dependency Checks
Keep `useExhaustiveDependencies` enabled to prevent stale closure bugs in React components.$c$,
    false, true, 3.0, now() - interval '8 days 20 hours', now() - interval '8 days 20 hours', ARRAY['__demo_seed__', 'react', 'hooks']),

    -- -------------------------------------------------------------------------
    -- 13. alternativeto.net (3 items: 1 domain + 2 exact on 1 page)
    -- -------------------------------------------------------------------------
    (v_user_id, 'alternativeto.net', 'domain', 'info',
$c$# AlternativeTo Listing Active
Registered sitecue as a browser-native alternative to Notion, Obsidian, and Raindrop.io.$c$,
    false, false, 1.0, now() - interval '22 hours', now() - interval '22 hours', ARRAY['__demo_seed__', 'alternativeto', 'marketing']),

    (v_user_id, 'alternativeto.net/software/sitecue/about', 'exact', 'info',
$c$# Upload Updated Product Screenshots
Add side-by-side visuals showing the Chrome extension side panel and the Basecamp web studio.$c$,
    false, false, 2.0, now() - interval '3 days 20 hours', now() - interval '3 days 20 hours', ARRAY['__demo_seed__', 'alternativeto', 'assets']),

    (v_user_id, 'alternativeto.net/software/sitecue/about', 'exact', 'idea',
$c$# Feature Tag Selection
Highlight `Side Panel`, `URL-Linked Notes`, `Markdown Editor`, and `Zero Management`.$c$,
    false, true, 3.0, now() - interval '7 days 6 hours', now() - interval '7 days 6 hours', ARRAY['__demo_seed__', 'seo', 'tags']),

    -- -------------------------------------------------------------------------
    -- 14. amazon.co.jp (2 items: 2 exact on 1 page)
    -- -------------------------------------------------------------------------
    (v_user_id, 'amazon.co.jp/dp/B0F7X3VJ99', 'exact', 'info',
$c$# 27-Inch 4K Monitor Comparison
Checking text sharpness and workspace width when keeping the code editor, browser viewport, and side panel open side by side.$c$,
    false, false, 1.0, now() - interval '2 days 14 hours', now() - interval '2 days 14 hours', ARRAY['__demo_seed__', 'hardware', 'monitor']),

    (v_user_id, 'amazon.co.jp/dp/B0F7X3VJ99', 'exact', 'idea',
$c$# Track Holiday Sale Price
Wait for upcoming seasonal deal before ordering.$c$,
    false, false, 2.0, now() - interval '6 days 2 hours', now() - interval '6 days 2 hours', ARRAY['__demo_seed__', 'shopping']),

    -- -------------------------------------------------------------------------
    -- 15. developer.mozilla.org (2 items: 2 exact on 1 page)
    -- -------------------------------------------------------------------------
    (v_user_id, 'developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API', 'exact', 'info',
$c$# Cross-Tab Sync via BroadcastChannel
Instantly reflect notes created in the extension side panel inside the open Basecamp web app tab.$c$,
    false, true, 1.0, now() - interval '4 days 6 hours', now() - interval '4 days 6 hours', ARRAY['__demo_seed__', 'web-api', 'sync']),

    (v_user_id, 'developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API', 'exact', 'info',
$c$# Clean Up Channel Listeners
Always invoke `channel.close()` on component unmount to avoid memory leaks.$c$,
    false, true, 2.0, now() - interval '10 days 12 hours', now() - interval '10 days 12 hours', ARRAY['__demo_seed__', 'javascript', 'memory']),

    -- -------------------------------------------------------------------------
    -- 16. inbox (2 items: Global unlinked notes)
    -- -------------------------------------------------------------------------
    (v_user_id, 'inbox', 'inbox', 'idea',
$c$# Outreach & Launch Channels
1. Submit updated visuals to software directories and extension showcases
2. Publish technical deep-dives on architecture and browser workflows
3. Refresh landing page hero section with real product screenshots$c$,
    true, false, 1.0, now() - interval '2 hours', now() - interval '2 hours', ARRAY['__demo_seed__', 'marketing', 'strategy']),

    (v_user_id, 'inbox', 'inbox', 'info',
$c$# Weekly Workflow Reflection (Global Inbox Note)
- Capturing notes directly on URLs during the week and turning them into structured drafts in Studio on weekends works seamlessly.
- Zero folder management means zero hesitation about where to write.$c$,
    false, false, 2.0, now() - interval '1 day', now() - interval '1 day', ARRAY['__demo_seed__', 'review', 'workflow']);

  -- ===========================================================================
  -- B. Insert 3 Demo Drafts (public.sitecue_drafts)
  -- ===========================================================================
  INSERT INTO public.sitecue_drafts (
    user_id, title, content, created_at, updated_at, tags
  )
  VALUES
    (v_user_id, 'Designing sitecue: Connecting Web Browsing Directly to Writing',
$c$# Why We Built sitecue

Have you ever paused mid-task wondering which app or folder to open just to jot down a quick thought?
Even when we carefully organize notes or clip articles into separate apps, they are disconnected from our actual workspace—the browser—and often end up forgotten.

## 1. The Inverse Approach to Web Clippers
Instead of clipping web pages into an external database, **sitecue lets you leave your own notes directly on the URL or domain itself**, automatically bringing them back the next time you visit.

## 2. Field Companion (Extension) + Home Base (Web App)
- **Side Panel Chrome Extension**: Take notes, manage page To-Dos, and access commands or links without leaving your active tab.
- **Web App (Basecamp)**: Review all your notes organized automatically by domain, and turn collected materials into blog posts or social updates in Studio.

No manual folders, no tagging overhead—just a direct workflow from browsing to writing.$c$,
    now() - interval '3 hours', now() - interval '1 hour', ARRAY['__demo_seed__', 'sitecue', 'concept']),

    (v_user_id, 'Building a Chrome Extension & Web App Monorepo with WXT, Next.js, and Supabase',
$c$# Architecture Overview

A practical guide to sharing types, authentication, and real-time data between a Manifest V3 Side Panel extension and a Next.js App Router dashboard.

## Tech Stack
- **Extension**: WXT, React, Tailwind CSS
- **Web App**: Next.js App Router, Hono, CodeMirror
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security)
- **Tooling**: Bun, Biome, Turborepo$c$,
    now() - interval '2 days', now() - interval '1 day', ARRAY['__demo_seed__', 'wxt', 'nextjs']),

    (v_user_id, 'Implementing Global SaaS Subscriptions with Polar.sh and Supabase',
$c$# Overview

How to set up recurring subscriptions for an indie web product using Polar.sh as a Merchant of Record to automate global sales tax and EU VAT compliance.

1. Configuring Products and Webhooks in Polar Sandbox
2. Local webhook testing with ngrok tunnels
3. Syncing subscription states to Supabase profiles via RLS$c$,
    now() - interval '4 days', now() - interval '3 days', ARRAY['__demo_seed__', 'polar', 'supabase']);

  RAISE NOTICE 'Successfully seeded 100 English demo notes and 3 drafts for user: % (ID: %)', v_target_email, v_user_id;
END $$;