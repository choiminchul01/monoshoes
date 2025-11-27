-- 상품 관리 기능을 위한 DB 스키마 업데이트
-- Supabase SQL Editor에서 실행하세요

-- 1. products 테이블에 품절 관리 필드 추가
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- 2. 품절 상태 확인용 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);

-- 3. 기존 상품의 is_available을 true로 설정
UPDATE products SET is_available = true WHERE is_available IS NULL;

-- 4. 관리자 상품 관리 권한 (RLS 정책)
-- 상품 추가 권한
CREATE POLICY IF NOT EXISTS "Admins can insert products" 
ON products FOR INSERT 
WITH CHECK (true);

-- 상품 수정 권한
CREATE POLICY IF NOT EXISTS "Admins can update products" 
ON products FOR UPDATE 
USING (true);

-- 상품 삭제 권한
CREATE POLICY IF NOT EXISTS "Admins can delete products" 
ON products FOR DELETE 
USING (true);
