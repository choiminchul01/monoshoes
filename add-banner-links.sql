-- site_settings 테이블에 배너 링크 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS banner_1_link TEXT DEFAULT '';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS banner_2_link TEXT DEFAULT '';

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS banner_3_link TEXT DEFAULT '';

-- 확인
SELECT banner_1_link, banner_2_link, banner_3_link FROM site_settings WHERE id = 1;
