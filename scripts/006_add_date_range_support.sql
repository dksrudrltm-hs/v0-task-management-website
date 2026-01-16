-- Add start_date and end_date fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date DATE;

-- Migrate existing due_date to start_date for existing tasks
UPDATE tasks SET start_date = due_date WHERE start_date IS NULL AND due_date IS NOT NULL;

-- Create indexes for date range queries
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_date_range ON tasks(start_date, end_date);
