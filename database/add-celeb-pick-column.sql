-- Celeb's PICK 기능을 위한 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. 셀럽픽 여부 컬럼
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_celeb_pick BOOLEAN DEFAULT false;

-- 2. 셀럽픽 표시용 이미지 인덱스 (0부터 시작, null이면 첫번째 이미지 사용)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS celeb_pick_image_index INTEGER DEFAULT NULL;
