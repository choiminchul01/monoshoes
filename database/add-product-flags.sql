-- 브랜드 판매가(원가) 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price INTEGER DEFAULT 0;

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'original_price';
