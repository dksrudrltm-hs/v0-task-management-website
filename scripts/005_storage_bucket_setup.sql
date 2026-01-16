-- ================================================================
-- Supabase Storage 버킷 설정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요.
-- ================================================================

-- 1. Storage 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS 정책 삭제 (기존 정책이 있다면)
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;

-- 3. Storage RLS 정책 생성
-- 업로드 정책: 인증된 사용자가 자신의 폴더에 파일 업로드 가능
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 읽기 정책: 인증된 사용자가 자신의 파일만 읽기 가능
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 삭제 정책: 인증된 사용자가 자신의 파일만 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 업데이트 정책: 인증된 사용자가 자신의 파일만 수정 가능
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. task_attachments 테이블 및 RLS (이미 실행했다면 무시됨)
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul')
);

CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON task_attachments(user_id);

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can insert own attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON task_attachments;

CREATE POLICY "Users can read own attachments" 
  ON task_attachments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments" 
  ON task_attachments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments" 
  ON task_attachments FOR DELETE 
  USING (auth.uid() = user_id);

-- 완료 메시지
SELECT 'Storage bucket and RLS policies created successfully!' as result;
