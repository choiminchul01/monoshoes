-- ========================================
-- ADMIN VIEW FIX SCRIPT (CORRECTED)
-- ========================================
-- 이 스크립트는 관리자 페이지에서 사용자 이메일과 상품 정보를
-- 올바르게 조회하기 위한 View를 생성합니다.
-- Supabase SQL Editor에서 실행해주세요.

-- 1. Admin General Q&A View (일반 문의 + 사용자 이메일)
CREATE OR REPLACE VIEW admin_general_qna_view AS
SELECT 
    gq.id,
    gq.user_id,
    gq.author_name,
    gq.title,
    gq.content,
    gq.answer,
    gq.is_private,
    gq.is_answered,
    gq.created_at,
    gq.answered_at,
    u.email as user_email
FROM general_qna gq
LEFT JOIN auth.users u ON gq.user_id = u.id;

-- 2. Admin Product Q&A View (상품 문의 + 사용자 이메일 + 상품 정보)
-- products 테이블의 images 컬럼은 배열이므로 첫 번째 이미지를 가져옵니다.
CREATE OR REPLACE VIEW admin_product_qna_view AS
SELECT 
    pq.id,
    pq.product_id,
    pq.user_id,
    pq.author_name,
    pq.question,
    pq.answer,
    pq.is_private,
    pq.is_answered,
    pq.created_at,
    pq.answered_at,
    u.email as user_email,
    p.name as product_name,
    p.images[1] as product_image_url
FROM product_qna pq
LEFT JOIN auth.users u ON pq.user_id = u.id
LEFT JOIN products p ON pq.product_id = p.id;

-- 3. 권한 설정 (인증된 사용자에게 조회 권한 부여)
-- 실제 보안은 API 레벨이나 추가적인 RLS로 관리해야 하지만,
-- View 자체는 접근 가능해야 합니다.
GRANT SELECT ON admin_general_qna_view TO authenticated;
GRANT SELECT ON admin_general_qna_view TO service_role;

GRANT SELECT ON admin_product_qna_view TO authenticated;
GRANT SELECT ON admin_product_qna_view TO service_role;

-- 4. (Optional) 기존 inquiries 테이블을 위한 View도 생성 (레거시 지원)
CREATE OR REPLACE VIEW admin_inquiries_view AS
SELECT 
    i.*,
    u.email as user_email
FROM inquiries i
LEFT JOIN auth.users u ON i.user_id = u.id;

GRANT SELECT ON admin_inquiries_view TO authenticated;
GRANT SELECT ON admin_inquiries_view TO service_role;
