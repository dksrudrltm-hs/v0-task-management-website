-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can read own attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can insert own attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON task_attachments;

-- Recreate RLS policies
CREATE POLICY "Users can read own attachments" 
  ON task_attachments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments" 
  ON task_attachments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments" 
  ON task_attachments FOR DELETE 
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Create storage bucket policies (these need to be set via Supabase dashboard or API)
-- The bucket "task-attachments" should have these policies:
-- 1. SELECT: authenticated users can read files in their own folder (storage.foldername(name)[1] = auth.uid()::text)
-- 2. INSERT: authenticated users can upload to their own folder
-- 3. DELETE: authenticated users can delete files in their own folder
