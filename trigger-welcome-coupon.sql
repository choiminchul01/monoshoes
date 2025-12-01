-- 신규 회원가입 시 웰컴 쿠폰 자동 발급 트리거
-- 이 SQL을 실행하면 신규 가입자에게 자동으로 'WELCOME5000' 쿠폰이 지급됩니다.

-- 1. 웰컴 쿠폰이 없으면 생성 (이미 있으면 무시)
INSERT INTO coupons (code, name, description, type, discount_value, min_order_amount, usage_per_user, valid_until, is_active)
VALUES (
    'WELCOME5000', 
    '신규가입 환영 쿠폰', 
    '에센시아에 가입해주셔서 감사합니다. 첫 구매 시 사용 가능한 5,000원 할인 쿠폰입니다.',
    'fixed', 
    5000, 
    30000, 
    1, 
    NULL, -- 무제한 (또는 NOW() + INTERVAL '30 days'로 설정 가능)
    true
)
ON CONFLICT (code) DO NOTHING;

-- 2. 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user_coupon()
RETURNS TRIGGER AS $$
DECLARE
    welcome_coupon_id UUID;
BEGIN
    -- WELCOME5000 쿠폰 ID 조회
    SELECT id INTO welcome_coupon_id FROM public.coupons WHERE code = 'WELCOME5000';

    -- 쿠폰이 존재하면 사용자에게 발급
    IF welcome_coupon_id IS NOT NULL THEN
        INSERT INTO public.user_coupons (user_id, coupon_id)
        VALUES (NEW.id, welcome_coupon_id)
        ON CONFLICT (user_id, coupon_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 생성 (auth.users 테이블에 INSERT 발생 시 실행)
DROP TRIGGER IF EXISTS on_auth_user_created_coupon ON auth.users;
CREATE TRIGGER on_auth_user_created_coupon
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_coupon();
