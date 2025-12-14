-- 브랜드 로고 관리를 위한 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS brand_logos JSONB DEFAULT '[]'::jsonb;

-- 기본 브랜드 데이터 삽입 (선택사항 - 이미지 URL 없이 이름만)
UPDATE site_settings 
SET brand_logos = '[
  {"name": "PRADA", "imageUrl": null, "order": 0},
  {"name": "CELINE", "imageUrl": null, "order": 1},
  {"name": "BOTTEGA VENETA", "imageUrl": null, "order": 2},
  {"name": "HERMÈS", "imageUrl": null, "order": 3},
  {"name": "GOYARD", "imageUrl": null, "order": 4},
  {"name": "GUCCI", "imageUrl": null, "order": 5},
  {"name": "LOUIS VUITTON", "imageUrl": null, "order": 6},
  {"name": "CHANEL", "imageUrl": null, "order": 7},
  {"name": "DIOR", "imageUrl": null, "order": 8},
  {"name": "BALENCIAGA", "imageUrl": null, "order": 9}
]'::jsonb
WHERE id = 1;
