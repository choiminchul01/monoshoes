-- 1. site_settings 테이블에 partnership_proposal_image 컬럼 추가
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS partnership_proposal_image TEXT;

-- 2. Partnership 전용 스토리지 버킷 생성
-- 이미 존재하면 무시됨
INSERT INTO storage.buckets (id, name, public)
VALUES ('partnership', 'partnership', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage 정책 (버킷 접근 권한)
-- 기존 정책과 충돌 방지를 위해 DROP 후 CREATE
DROP POLICY IF EXISTS "Public Read Partnership" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Partnership" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Partnership" ON storage.objects;

-- 읽기 허용 (누구나)
CREATE POLICY "Public Read Partnership"
ON storage.objects FOR SELECT
USING ( bucket_id = 'partnership' );

-- 업로드 허용 (인증된 사용자)
CREATE POLICY "Auth Upload Partnership"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'partnership' AND auth.role() = 'authenticated' );

-- 삭제 허용 (인증된 사용자)
CREATE POLICY "Auth Delete Partnership"
ON storage.objects FOR DELETE
USING ( bucket_id = 'partnership' AND auth.role() = 'authenticated' );
