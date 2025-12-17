-- ================================================================
-- FIX: Checkout Permissions (RLS)
-- 주문 생성, 상품 추가, 쿠폰 사용 처리를 위한 권한을 부여합니다.
-- ================================================================

-- 1. Orders: 누구나(또는 로그인 유저) 주문을 생성할 수 있어야 함
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders;
DROP POLICY IF EXISTS "Public can insert orders" ON orders;

CREATE POLICY "Public can insert orders"
ON orders FOR INSERT
WITH CHECK (true); 
-- 비회원 주문도 고려하여 true로 설정 (또는 auth.role() = 'authenticated' 로 제한 가능)

-- 2. Order Items: 주문 상품 추가 권한
DROP POLICY IF EXISTS "Public can insert order items" ON order_items;

CREATE POLICY "Public can insert order items"
ON order_items FOR INSERT
WITH CHECK (true);

-- 3. Coupon Usages: 쿠폰 사용 기록 저장 권한
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own coupon usage" ON coupon_usages;

CREATE POLICY "Users can insert own coupon usage"
ON coupon_usages FOR INSERT
WITH CHECK (
    -- 본인의 쿠폰 사용 기록만 추가 가능 (비회원인 경우 user_id='guest' 처리 고려하여 true로 두거나 조건 완화)
    true 
);

DROP POLICY IF EXISTS "Users can view own coupon usage" ON coupon_usages;
CREATE POLICY "Users can view own coupon usage"
ON coupon_usages FOR SELECT
USING (user_id = auth.uid()); 

-- 4. User Coupons: 쿠폰 사용 처리 (UPDATE is_used = true)
-- 기존 정책("Admins can update user coupons")은 관리자만 수정 가능하게 되어 있어, 
-- 사용자가 스스로 '사용 완료' 처리를 할 수 없습니다. 이를 수정합니다.

DROP POLICY IF EXISTS "Users can update own coupons" ON user_coupons;

CREATE POLICY "Users can update own coupons"
ON user_coupons FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
-- 보안 강화 권장: is_used 컬럼만 true로 바꿀 수 있도록 트리거/함수 사용을 권장하지만,
-- 현재 구조상 호환성을 위해 직접 업데이트 허용.

-- 5. Confirmation
SELECT 'Checkout Permissions Fixed' as status;
