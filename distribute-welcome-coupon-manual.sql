-- ================================================================
-- Backfill Welcome Coupon for Existing Users
-- 신규 가입 트리거가 적용되기 전에 가입한 기존 회원들에게도 웰컴 쿠폰을 지급합니다.
-- ================================================================

-- 1. Ensure Coupon Exists
INSERT INTO coupons (code, name, description, type, discount_value, min_order_amount, usage_per_user, valid_until, is_active)
VALUES (
    'WELCOME5000', 
    '신규가입 환영 쿠폰', 
    '에센시아에 가입해주셔서 감사합니다. 첫 구매 시 사용 가능한 5,000원 할인 쿠폰입니다.',
    'fixed', 
    5000, 
    30000, 
    1, 
    NULL,
    true
)
ON CONFLICT (code) DO NOTHING;

-- 2. Distribute to ALL existing users who don't have it yet
DO $$
DECLARE
    v_coupon_id UUID;
BEGIN
    -- Get ID of the Welcome Coupon
    SELECT id INTO v_coupon_id FROM coupons WHERE code = 'WELCOME5000';

    IF v_coupon_id IS NOT NULL THEN
        -- Insert for all users in auth.users
        INSERT INTO user_coupons (user_id, coupon_id)
        SELECT id, v_coupon_id
        FROM auth.users
        WHERE NOT EXISTS (
            SELECT 1 FROM user_coupons uc 
            WHERE uc.user_id = auth.users.id 
            AND uc.coupon_id = v_coupon_id
        );
        
        RAISE NOTICE 'Welcome coupons distributed to existing users.';
    ELSE
        RAISE NOTICE 'Coupon WELCOME5000 not found.';
    END IF;
END $$;
