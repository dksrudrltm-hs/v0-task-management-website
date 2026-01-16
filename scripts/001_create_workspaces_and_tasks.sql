-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_workspaces_key ON workspaces(workspace_key);

-- Enable RLS on workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspaces
-- Allow anyone to read any workspace (since we use workspace_key for access control)
CREATE POLICY "Allow public read access to workspaces" 
  ON workspaces FOR SELECT 
  USING (true);

-- Allow anyone to insert workspaces
CREATE POLICY "Allow public insert to workspaces" 
  ON workspaces FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to update workspaces
CREATE POLICY "Allow public update to workspaces" 
  ON workspaces FOR UPDATE 
  USING (true);

-- Allow anyone to delete workspaces
CREATE POLICY "Allow public delete from workspaces" 
  ON workspaces FOR DELETE 
  USING (true);

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
-- Allow anyone to read any task (workspace_key verification happens in application layer)
CREATE POLICY "Allow public read access to tasks" 
  ON tasks FOR SELECT 
  USING (true);

-- Allow anyone to insert tasks
CREATE POLICY "Allow public insert to tasks" 
  ON tasks FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to update tasks
CREATE POLICY "Allow public update to tasks" 
  ON tasks FOR UPDATE 
  USING (true);

-- Allow anyone to delete tasks
CREATE POLICY "Allow public delete from tasks" 
  ON tasks FOR DELETE 
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_workspaces_updated_at 
  BEFORE UPDATE ON workspaces 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
