-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
  CONSTRAINT valid_file_size CHECK (file_size <= 10485760)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON task_attachments(user_id);

-- Enable RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own attachments" 
  ON task_attachments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments" 
  ON task_attachments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments" 
  ON task_attachments FOR DELETE 
  USING (auth.uid() = user_id);

-- Note: Storage bucket "task-attachments" must be created via Supabase dashboard
-- with policies allowing authenticated users to upload/download/delete their own files
