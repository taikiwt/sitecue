-- 1. profiles table extension
ALTER TABLE public.sitecue_profiles
ADD COLUMN IF NOT EXISTS ai_usage_reset_at timestamp with time zone DEFAULT (now() + interval '1 month');

-- Initialize existing rows if any
UPDATE public.sitecue_profiles SET ai_usage_reset_at = (now() + interval '1 month') WHERE ai_usage_reset_at IS NULL;

-- 2. pg_cron support
-- Note: Requires superuser in standard Supabase, but we declare it here as per migration practice.
-- We also need to grant usage on the cron schema to the postgres role if not already there.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Automatic Cleanup Job
-- Delete records older than 1 hour from sitecue_page_contents
-- Schedule: every hour (0 * * * *)
-- We use a unique name for the job to avoid duplicates on re-runs.
SELECT cron.schedule(
  'cleanup-sitecue-page-contents', -- unique job name
  '0 * * * *',                   -- every hour
  $$ DELETE FROM public.sitecue_page_contents WHERE created_at < now() - interval '1 hour' $$
);
