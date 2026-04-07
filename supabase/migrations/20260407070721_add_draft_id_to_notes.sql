-- Add draft_id column as foreign key to sitecue_drafts
ALTER TABLE sitecue_notes 
ADD COLUMN draft_id uuid REFERENCES sitecue_drafts(id) ON DELETE CASCADE;

-- Update scope constraint to allow 'draft'
ALTER TABLE sitecue_notes DROP CONSTRAINT IF EXISTS sitecue_notes_scope_check;
ALTER TABLE sitecue_notes ADD CONSTRAINT sitecue_notes_scope_check CHECK (scope IN ('domain', 'exact', 'inbox', 'draft'));
