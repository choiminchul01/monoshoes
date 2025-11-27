-- orders 테이블의 CHECK CONSTRAINT 문제 해결
-- 문제: orders_payment_status_check 제약 조건이 업데이트를 차단
-- 해결: 기존 제약 조건 삭제 후 올바른 값으로 재생성

-- 1. 기존 CHECK CONSTRAINT 삭제
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- 2. 새로운 CHECK CONSTRAINT 생성
ALTER TABLE orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'shipped', 'delivered'));

-- 3. 확인: 현재 테이블의 모든 payment_status 값 조회
SELECT DISTINCT payment_status FROM orders;

-- 참고: 만약 위의 SELECT 결과에 'pending', 'paid', 'shipped', 'delivered' 외의 값이 있다면
-- 해당 값들을 먼저 수정한 후 제약 조건을 추가해야 합니다
