-- ================================================================
-- Additional Features: Coupon, Point, Product Q&A System
-- ================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. COUPON SYSTEM (쿠폰/프로모션 시스템)
-- ================================================================

-- 쿠폰 테이블
CREATE TABLE IF NOT EXISTS coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL, -- 쿠폰 코드 (예: "WELCOME2024")
    name TEXT NOT NULL, -- 쿠폰 이름 (예: "신규가입 10% 할인")
    description TEXT, -- 쿠폰 설명 (예: "신규 회원 가입 고객에게 드리는 특별 할인")
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')), -- 'percentage': 퍼센트 할인, 'fixed': 고정 금액 할인
    discount_value INTEGER NOT NULL, -- 할인 값 (percentage면 10 = 10%, fixed면 10000 = 10000원)
    min_order_amount INTEGER DEFAULT 0, -- 최소 주문 금액
    max_discount_amount INTEGER, -- 최대 할인 금액 (percentage 타입일 때만 사용)
    usage_limit INTEGER, -- 전체 사용 제한 (NULL이면 무제한)
    usage_per_user INTEGER DEFAULT 1, -- 사용자당 사용 제한
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 쿠폰 사용 이력
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount INTEGER NOT NULL, -- 실제 적용된 할인 금액
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 쿠폰 보유 (발급받은 쿠폰)
CREATE TABLE IF NOT EXISTS user_coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT FALSE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, coupon_id)
);

-- ================================================================
-- 2. POINT SYSTEM (포인트/적립금 시스템)
-- ================================================================

-- 사용자 포인트 잔액
CREATE TABLE IF NOT EXISTS user_points (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER DEFAULT 0, -- 누적 적립 포인트
    total_used INTEGER DEFAULT 0, -- 누적 사용 포인트
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포인트 거래 내역
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('earn', 'use', 'expire', 'admin')),
    amount INTEGER NOT NULL, -- 양수: 적립, 음수: 차감
    balance_after INTEGER NOT NULL, -- 거래 후 잔액
    description TEXT NOT NULL, -- 거래 설명 (예: "주문 적립", "포인트 사용")
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- 주문 관련 거래일 경우
    expires_at TIMESTAMP WITH TIME ZONE, -- 적립 포인트의 만료일 (earn 타입일 때만)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 3. PRODUCT Q&A SYSTEM (제품별 Q&A)
-- ================================================================

-- 제품 문의
CREATE TABLE IF NOT EXISTS product_qna (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT, -- 작성자명 (비회원도 가능하게)
    question TEXT NOT NULL,
    answer TEXT,
    is_private BOOLEAN DEFAULT FALSE, -- 비공개 문의 여부
    is_answered BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- RLS POLICIES (Row Level Security)
-- ================================================================

-- Coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
CREATE POLICY "Public can view active coupons" ON coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own coupon usages" ON coupon_usages;
CREATE POLICY "Users can view own coupon usages" ON coupon_usages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own coupons" ON user_coupons;
CREATE POLICY "Users can view own coupons" ON user_coupons FOR SELECT USING (auth.uid() = user_id);

-- Points
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own points" ON user_points;
CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own point transactions" ON point_transactions;
CREATE POLICY "Users can view own point transactions" ON point_transactions FOR SELECT USING (auth.uid() = user_id);

-- Product Q&A
ALTER TABLE product_qna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public QnA" ON product_qna;
CREATE POLICY "Public can view public QnA" ON product_qna FOR SELECT USING (is_private = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create QnA" ON product_qna;
CREATE POLICY "Users can create QnA" ON product_qna FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own QnA" ON product_qna;
CREATE POLICY "Users can update own QnA" ON product_qna FOR UPDATE USING (auth.uid() = user_id);

-- ================================================================
-- INDEXES (성능 최적화)
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON user_coupons(user_id, is_used);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_order ON point_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_product_qna_product ON product_qna(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_qna_user ON product_qna(user_id);

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- 포인트 잔액 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_points_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- user_points 테이블에 해당 유저가 없으면 생성
    INSERT INTO user_points (user_id, balance, total_earned, total_used)
    VALUES (NEW.user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- 포인트 적립/사용에 따라 잔액 업데이트
    IF NEW.type = 'earn' THEN
        UPDATE user_points
        SET balance = balance + NEW.amount,
            total_earned = total_earned + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'use' THEN
        UPDATE user_points
        SET balance = balance + NEW.amount, -- amount는 음수
            total_used = total_used - NEW.amount, -- 양수로 저장
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 포인트 거래 시 잔액 자동 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_user_points ON point_transactions;
CREATE TRIGGER trigger_update_user_points
AFTER INSERT ON point_transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_points_balance();

-- ================================================================
-- SAMPLE DATA (테스트용 샘플 데이터)
-- ================================================================

-- 샘플 쿠폰
INSERT INTO coupons (code, name, type, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_until, is_active)
VALUES
    ('WELCOME10', '신규가입 10% 할인', 'percentage', 10, 30000, 10000, NULL, NOW() + INTERVAL '90 days', true),
    ('FREESHIP', '무료배송 쿠폰', 'fixed', 3000, 0, NULL, NULL, NOW() + INTERVAL '30 days', true),
    ('VIP20', 'VIP 20% 할인', 'percentage', 20, 50000, 50000, 100, NOW() + INTERVAL '60 days', true)
ON CONFLICT (code) DO NOTHING;
