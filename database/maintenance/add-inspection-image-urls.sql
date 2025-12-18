-- 출고관리 다중 이미지 지원을 위한 스키마 변경
-- Supabase SQL Editor에서 실행

-- 1. image_urls 배열 컬럼 추가
ALTER TABLE inspections 
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- 2. 기존 단일 이미지 데이터를 배열로 마이그레이션
UPDATE inspections 
SET image_urls = ARRAY[image_url] 
WHERE image_urls IS NULL AND image_url IS NOT NULL;

-- 3. 확인
SELECT id, customer_name, image_url, image_urls FROM inspections LIMIT 5;
