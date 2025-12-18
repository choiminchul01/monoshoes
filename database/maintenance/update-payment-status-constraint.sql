-- 주문 상태 관리 리팩토링을 위한 payment_status 제약 조건 업데이트
-- 새 상태 흐름: pending → paid → preparing → shipped
-- 삭제: delivered 상태

-- 1. 기존 CHECK 제약 조건 삭제
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- 2. 새 CHECK 제약 조건 추가 (preparing 포함, delivered 제거)
ALTER TABLE orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'preparing', 'shipped'));

-- 3. 기존 'delivered' 상태의 주문을 'shipped'로 변경 (있다면)
UPDATE orders SET payment_status = 'shipped' WHERE payment_status = 'delivered';

-- 4. 확인: 현재 테이블의 모든 payment_status 값 조회
SELECT DISTINCT payment_status, COUNT(*) as count FROM orders GROUP BY payment_status;
