-- ========================================
-- Q&A SYSTEM TABLES SETUP
-- ========================================

-- 1. Product Q&A Table (상품 문의)
CREATE TABLE IF NOT EXISTS product_qna (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT, -- 사용자 이름 또는 익명
    question TEXT NOT NULL,
    answer TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE
);

-- 2. General Q&A Board Table (일반 문의 게시판)
CREATE TABLE IF NOT EXISTS general_qna (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    answer TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- RLS Policies
-- ========================================

ALTER TABLE product_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_qna ENABLE ROW LEVEL SECURITY;

-- Product Q&A Policies
-- 1. 조회: 공개글은 누구나, 비공개글은 본인 또는 관리자만
DROP POLICY IF EXISTS "Public product qna view" ON product_qna;
CREATE POLICY "Public product qna view" ON product_qna FOR SELECT
USING (
    is_private = false 
    OR (auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
);

-- 2. 작성: 로그인한 사용자만
DROP POLICY IF EXISTS "Authenticated users can create product qna" ON product_qna;
CREATE POLICY "Authenticated users can create product qna" ON product_qna FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. 수정/삭제: 본인 또는 관리자
DROP POLICY IF EXISTS "Users can update own product qna" ON product_qna;
CREATE POLICY "Users can update own product qna" ON product_qna FOR UPDATE
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own product qna" ON product_qna;
CREATE POLICY "Users can delete own product qna" ON product_qna FOR DELETE
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

-- General Q&A Policies
-- 1. 조회: 공개글은 누구나, 비공개글은 본인 또는 관리자만
DROP POLICY IF EXISTS "Public general qna view" ON general_qna;
CREATE POLICY "Public general qna view" ON general_qna FOR SELECT
USING (
    is_private = false 
    OR (auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
);

-- 2. 작성: 로그인한 사용자만
DROP POLICY IF EXISTS "Authenticated users can create general qna" ON general_qna;
CREATE POLICY "Authenticated users can create general qna" ON general_qna FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. 수정/삭제: 본인 또는 관리자
DROP POLICY IF EXISTS "Users can update own general qna" ON general_qna;
CREATE POLICY "Users can update own general qna" ON general_qna FOR UPDATE
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own general qna" ON general_qna;
CREATE POLICY "Users can delete own general qna" ON general_qna FOR DELETE
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));
