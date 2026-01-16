import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://zglkqcddysmoxttykkef.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbGtxY2RkeXNtb3h0dHlra2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTMxNDgsImV4cCI6MjA4Mzk4OTE0OH0.zQHOPiid2hPO_7_BJEIEQyn0V3jVXf7aAXwagoT9dP0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Workspace = {
  id: string
  workspace_key: string
  name: string
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  workspace_id: string
  user_id: string
  title: string
  description: string | null
  status: "backlog" | "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high" | null
  due_date: string | null // Kept for backward compatibility
  start_date: string | null // New field for date range start
  end_date: string | null // New field for date range end
  start_time: string | null
  end_time: string | null
  kanban_order: number
  created_at: string
  updated_at: string
}

export type TaskAttachment = {
  id: string
  task_id: string
  user_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  created_at: string
}
