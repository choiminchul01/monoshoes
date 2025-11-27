-- 개발/테스트용: 모든 사용자(비로그인 포함)에게 권한 허용
-- 주의: 실제 서비스 배포 시에는 이 설정을 되돌리고 인증 시스템을 구축해야 합니다.

-- 1. products 테이블 권한: 누구나 읽기/쓰기/수정/삭제 가능
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access" ON products;
DROP POLICY IF EXISTS "Public Read Access" ON products;
DROP POLICY IF EXISTS "Admin Full Access" ON products;

CREATE POLICY "Public Full Access"
ON products FOR ALL
USING (true)
WITH CHECK (true);

-- 2. storage (product-images) 권한: 누구나 업로드/삭제 가능
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

CREATE POLICY "Public Storage Access"
ON storage.objects FOR ALL
USING ( bucket_id = 'product-images' )
WITH CHECK ( bucket_id = 'product-images' );
