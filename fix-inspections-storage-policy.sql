-- ==============================================
-- Supabase Storage Bucket 정책 설정
-- inspections 버킷에 대한 권한 설정
-- ==============================================

-- 1. 먼저 Supabase 대시보드에서 inspections 버킷이 존재하는지 확인
-- Storage > Buckets 에서 "inspections" 버킷 확인

-- 2. 버킷이 없다면 생성 (SQL Editor에서 실행)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspections', 'inspections', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage 정책 설정 - 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can view inspections" ON storage.objects
FOR SELECT USING (bucket_id = 'inspections');

-- 4. 인증된 사용자 (관리자) 업로드 허용
CREATE POLICY "Authenticated users can upload inspections" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'inspections' 
    AND auth.role() = 'authenticated'
);

-- 5. 인증된 사용자 (관리자) 수정 허용
CREATE POLICY "Authenticated users can update inspections" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'inspections' 
    AND auth.role() = 'authenticated'
);

-- 6. 인증된 사용자 (관리자) 삭제 허용
CREATE POLICY "Authenticated users can delete inspections" ON storage.objects
FOR DELETE USING (
    bucket_id = 'inspections' 
    AND auth.role() = 'authenticated'
);

-- ==============================================
-- 또는 간단하게 모든 권한 허용 (개발/테스트용)
-- ==============================================

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Anyone can view inspections" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inspections" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update inspections" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete inspections" ON storage.objects;

-- 모든 작업 허용 정책 (서비스 롤 키 사용 시 RLS 우회됨)
CREATE POLICY "Allow all operations on inspections bucket" ON storage.objects
FOR ALL USING (bucket_id = 'inspections');

-- ==============================================
-- inspections 테이블 RLS 정책
-- ==============================================

-- 테이블 RLS 활성화 확인
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can read inspections" ON inspections;
DROP POLICY IF EXISTS "Admins can manage inspections" ON inspections;

-- 읽기: 누구나 가능
CREATE POLICY "Anyone can read inspections" ON inspections
FOR SELECT USING (true);

-- 쓰기: 인증된 사용자만 (관리자)
CREATE POLICY "Authenticated can manage inspections" ON inspections
FOR ALL USING (auth.role() = 'authenticated');
