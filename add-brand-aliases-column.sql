-- site_settings 테이블에 brand_aliases 컬럼 추가
-- Supabase SQL Editor에서 실행

-- brand_aliases 컬럼 추가 (JSONB 타입)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS brand_aliases JSONB DEFAULT '{}'::jsonb;

-- 예시 데이터 추가 (선택사항)
-- UPDATE site_settings 
-- SET brand_aliases = '{"CELINE": ["셀린느", "셀린"], "DIOR": ["디올"], "CHANEL": ["샤넬"]}'::jsonb
-- WHERE id = 1;
