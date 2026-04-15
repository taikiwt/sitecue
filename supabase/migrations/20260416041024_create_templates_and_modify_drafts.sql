-- 1. Create Templates Table
CREATE TABLE sitecue_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    max_length INTEGER,
    boilerplate TEXT,
    weave_prompt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sitecue_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own templates"
    ON sitecue_templates FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Modify Drafts Table
-- Add template_id first
ALTER TABLE sitecue_drafts ADD COLUMN template_id UUID REFERENCES sitecue_templates(id) ON DELETE SET NULL;

-- Drop target_platform
ALTER TABLE sitecue_drafts DROP COLUMN target_platform;

-- Create an index for performance
CREATE INDEX idx_sitecue_drafts_template_id ON sitecue_drafts(template_id);
