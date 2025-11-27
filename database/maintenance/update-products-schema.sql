-- products 테이블 스키마 업데이트
-- Supabase SQL Editor에서 실행하세요

-- 1. is_available 컬럼 추가 (품절/판매중 상태)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- 2. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- 3. 재고가 0이면 자동으로 is_available을 false로 설정하는 트리거
CREATE OR REPLACE FUNCTION update_product_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock = 0 THEN
        NEW.is_available = false;
    ELSIF NEW.stock > 0 AND OLD.stock = 0 THEN
        NEW.is_available = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 적용
DROP TRIGGER IF EXISTS update_products_availability ON products;
CREATE TRIGGER update_products_availability
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_availability();

-- 완료!
