-- ================================================
-- Task Attachments 완전 설정 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. task_attachments 테이블 생성 (없는 경우)
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

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON task_attachments(user_id);

-- 3. RLS 활성화
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- 4. 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can read own attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can insert own attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can update own attachments" ON task_attachments;

-- 5. 새로운 RLS 정책 생성
CREATE POLICY "Users can read own attachments" 
  ON task_attachments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments" 
  ON task_attachments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attachments" 
  ON task_attachments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments" 
  ON task_attachments FOR DELETE 
  USING (auth.uid() = user_id);

-- ================================================
-- Storage Bucket 및 정책 설정
-- 주의: Storage 버킷은 Supabase Dashboard > Storage에서 수동으로 생성해야 함
-- 버킷 이름: task-attachments
-- Public: false
-- ================================================

-- Storage 정책 (Supabase Dashboard > Storage > Policies에서 설정)
-- 다음 정책들을 추가하세요:

-- SELECT (다운로드) 정책:
-- Policy name: Users can download own attachments
-- Target roles: authenticated
-- Policy definition: (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1])

-- INSERT (업로드) 정책:
-- Policy name: Users can upload to own folder
-- Target roles: authenticated  
-- Policy definition: (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1])

-- DELETE (삭제) 정책:
-- Policy name: Users can delete own files
-- Target roles: authenticated
-- Policy definition: (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1])
