-- 1. site_settings 테이블에 partnership_proposal_images (Array) 컬럼 추가
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS partnership_proposal_images TEXT[] DEFAULT '{}';

-- 2. 기존 단일 이미지 데이터를 배열로 마이그레이션 (데이터 보존)
-- partnership_proposal_image가 NULL이 아니면서 partnership_proposal_images가 비어있는 경우에만 실행
UPDATE site_settings
SET partnership_proposal_images = ARRAY[partnership_proposal_image]
WHERE partnership_proposal_image IS NOT NULL 
  AND (partnership_proposal_images IS NULL OR partnership_proposal_images = '{}');

-- 3. (확인용) 변경된 데이터 조회
SELECT id, partnership_proposal_image, partnership_proposal_images FROM site_settings;
