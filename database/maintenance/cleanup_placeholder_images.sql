-- 기존 placeholder 이미지 URL 제거
-- Supabase SQL Editor에서 실행하세요

-- 1. placeholder URL이 있는 상품 확인
SELECT id, name, images 
FROM products 
WHERE images::text LIKE '%placehold.co%' 
   OR images::text LIKE '%Array(0)%';

-- 2. placeholder URL 제거 (이미지를 빈 배열로 설정)
UPDATE products
SET images = '{}'::text[]
WHERE images::text LIKE '%placehold.co%' 
   OR images::text LIKE '%Array(0)%';

-- 3. 결과 확인
SELECT id, name, images FROM products;
