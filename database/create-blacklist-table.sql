-- ============================================
-- 🚫 블랙리스트 고객 테이블 생성
-- Supabase SQL Editor에서 복사 붙여넣기 후 실행
-- ============================================

-- 블랙리스트 테이블 생성
CREATE TABLE IF NOT EXISTS blacklisted_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_by UUID REFERENCES auth.users(id)
);

-- RLS 비활성화 (개발 단계)
ALTER TABLE blacklisted_customers DISABLE ROW LEVEL SECURITY;

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_blacklisted_phone ON blacklisted_customers(phone);

-- 확인 메시지
SELECT 'blacklisted_customers 테이블 생성 완료!' AS result;
