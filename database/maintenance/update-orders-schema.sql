-- 주문 관리 개선을 위한 스키마 업데이트
-- Supabase SQL Editor에서 실행하세요

-- 1. orders 테이블에 배송 관련 필드 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_company TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_memo TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_status_updated_at ON orders(status_updated_at DESC);

-- 3. 주문 상태 업데이트 트리거
CREATE OR REPLACE FUNCTION update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status != OLD.payment_status OR NEW.order_status != OLD.order_status THEN
        NEW.status_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 적용
DROP TRIGGER IF EXISTS update_orders_status_timestamp ON orders;
CREATE TRIGGER update_orders_status_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_status_timestamp();

-- 완료!
