-- Add start_date and end_date columns to tasks table for multi-day task support
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create indexes for better query performance on date range queries
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);

-- Migrate existing tasks: copy due_date to start_date for consistency
UPDATE tasks 
SET start_date = due_date 
WHERE start_date IS NULL AND due_date IS NOT NULL;

-- Show confirmation
SELECT 'Date range columns added successfully' as status;
</parameter>
