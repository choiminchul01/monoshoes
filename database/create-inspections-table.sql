-- ⚠️ [중요] Storage 버킷만 생성하는 SQL
-- 이미 테이블 관련 정책이 존재해서 에러가 발생했다면, 이 아래 내용만 복사해서 실행하세요.

-- 1. 스토리지 버킷 생성 (이미 있으면 무시됨)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspections', 'inspections', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage 정책 (버킷 접근 권한)
-- 기존 정책과 충돌 방지를 위해 DROP 후 CREATE
DROP POLICY IF EXISTS "Public Read Inspections" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Inspections" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Inspections" ON storage.objects;

-- 읽기 허용 (누구나)
CREATE POLICY "Public Read Inspections"
ON storage.objects FOR SELECT
USING ( bucket_id = 'inspections' );

-- 업로드 허용 (인증된 사용자)
CREATE POLICY "Auth Upload Inspections"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'inspections' AND auth.role() = 'authenticated' );

-- 삭제 허용 (인증된 사용자)
CREATE POLICY "Auth Delete Inspections"
ON storage.objects FOR DELETE
USING ( bucket_id = 'inspections' AND auth.role() = 'authenticated' );
