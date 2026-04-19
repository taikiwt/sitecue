-- Up
ALTER TABLE public.sitecue_notes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.sitecue_drafts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
