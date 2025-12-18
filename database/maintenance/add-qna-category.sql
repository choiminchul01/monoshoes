-- ========================================
-- Add category column to product_qna table
-- ========================================

-- 카테고리 컬럼 추가 (색상, 사이즈, 배송, 결제, 기타)
ALTER TABLE product_qna 
ADD COLUMN IF NOT EXISTS category TEXT;

-- 기본값 설정 (기존 데이터는 'other'로 처리)
UPDATE product_qna 
SET category = 'other' 
WHERE category IS NULL;

-- ========================================
-- 모든 기존 Q&A를 비공개로 전환
-- ========================================
UPDATE product_qna 
SET is_private = TRUE 
WHERE is_private = FALSE;

-- 인덱스 추가 (카테고리별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_product_qna_category ON product_qna(category);

-- 코멘트 추가
COMMENT ON COLUMN product_qna.category IS '문의 유형: color, size, delivery, payment, other';

