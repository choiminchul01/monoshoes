-- 관리자 상품 삭제 및 쇼핑몰 노출을 위한 권한 설정 스크립트
-- Supabase SQL Editor에서 이 코드를 복사하여 실행해주세요.

-- 1. RLS(행 수준 보안) 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Public Read Access" ON products;
DROP POLICY IF EXISTS "Admin Full Access" ON products;

-- 3. 누구나 상품을 볼 수 있도록 허용 (SELECT)
CREATE POLICY "Public Read Access"
ON products FOR SELECT
USING (true);

-- 4. 로그인한 관리자는 모든 작업(추가/수정/삭제) 허용
CREATE POLICY "Admin Full Access"
ON products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
