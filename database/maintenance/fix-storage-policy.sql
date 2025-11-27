-- Storage 버킷 권한 설정 (복사해서 Supabase SQL Editor에서 실행하세요)

-- 1. product-images 버킷이 없으면 생성 (이미 있으면 넘어감)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 기존 정책 초기화 (충돌 방지)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- 3. 누구나 이미지 보기 허용 (SELECT)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 4. 로그인한 사용자(관리자)는 업로드 허용 (INSERT)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- 5. 로그인한 사용자(관리자)는 수정/삭제 허용 (UPDATE, DELETE)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );
