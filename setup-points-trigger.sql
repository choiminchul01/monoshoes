-- 포인트 자동 적립 시스템 구축 SQL
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요.

-- 1. 포인트 관련 테이블 확인 및 생성 (기존 테이블이 없을 경우 대비)
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('earn', 'use', 'expire', 'admin')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 포인트 트랜잭션에 주문 ID 컬럼 추가 (중복 적립 방지 및 추적용)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'point_transactions' AND column_name = 'order_id') THEN
        ALTER TABLE point_transactions ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. 결제 완료 시 포인트 적립 함수
CREATE OR REPLACE FUNCTION handle_order_payment_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_point_amount INTEGER;
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- 결제 상태가 'paid' 또는 'confirmed'로 변경되었을 때만 실행
    -- (Admin 페이지에서는 'paid'를 사용하고, 초기 스키마는 'confirmed'를 사용함)
    IF (NEW.payment_status = 'paid' OR NEW.payment_status = 'confirmed') 
       AND (OLD.payment_status IS NULL OR (OLD.payment_status != 'paid' AND OLD.payment_status != 'confirmed')) THEN
        
        -- 주문에서 이메일을 기반으로 사용자 ID 찾기
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE email = NEW.customer_email
        LIMIT 1;
        
        -- 사용자를 찾지 못했거나, 이미 해당 주문으로 적립된 내역이 있으면 종료
        IF v_user_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        IF EXISTS (SELECT 1 FROM point_transactions WHERE order_id = NEW.id AND type = 'earn') THEN
            RETURN NEW;
        END IF;

        -- 2. 적립할 포인트 계산 (최종 결제 금액의 1%)
        v_point_amount := FLOOR(NEW.final_amount * 0.01);
        
        -- 포인트가 0이면 적립 안함
        IF v_point_amount <= 0 THEN
            RETURN NEW;
        END IF;

        -- 3. 현재 포인트 잔액 가져오기 (없으면 생성)
        SELECT balance INTO v_current_balance
        FROM user_points
        WHERE user_id = v_user_id;
        
        IF v_current_balance IS NULL THEN
            INSERT INTO user_points (user_id, balance, total_earned, total_used)
            VALUES (v_user_id, 0, 0, 0)
            RETURNING balance INTO v_current_balance;
        END IF;
        
        v_new_balance := v_current_balance + v_point_amount;

        -- 4. 포인트 트랜잭션 기록
        INSERT INTO point_transactions (
            user_id, 
            type, 
            amount, 
            balance_after, 
            description, 
            order_id
        ) VALUES (
            v_user_id, 
            'earn', 
            v_point_amount, 
            v_new_balance, 
            '구매 적립 (주문번호: ' || NEW.order_number || ')', 
            NEW.id
        );

        -- 5. 사용자 포인트 잔액 업데이트
        UPDATE user_points
        SET 
            balance = v_new_balance,
            total_earned = total_earned + v_point_amount,
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 트리거 생성
DROP TRIGGER IF EXISTS on_order_payment_confirmed ON orders;

CREATE TRIGGER on_order_payment_confirmed
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_payment_confirmed();

-- RLS 정책 업데이트 (포인트 트랜잭션 읽기 권한)
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON point_transactions;

CREATE POLICY "Users can view their own transactions" 
ON point_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- user_points RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own points" ON user_points;

CREATE POLICY "Users can view their own points" 
ON user_points FOR SELECT 
USING (auth.uid() = user_id);
