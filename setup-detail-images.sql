-- 상품 상세페이지 이미지 시스템 설정
-- products 테이블에 detail_images 컬럼 추가 및 Storage 버킷 생성

-- 1. detail_images 컬럼 추가 (텍스트 배열)
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_images TEXT[] DEFAULT '{}';

-- 2. product-details Storage 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-details', 'product-details', true) 
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS 정책 설정

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Public can view detail images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload detail images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete detail images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update detail images" ON storage.objects;

-- 모든 사용자가 상세 이미지 조회 가능
CREATE POLICY "Public can view detail images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-details');

-- 인증된 사용자만 상세 이미지 업로드 가능
CREATE POLICY "Authenticated users can upload detail images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-details' AND auth.role() = 'authenticated');

-- 인증된 사용자만 상세 이미지 삭제 가능
CREATE POLICY "Authenticated users can delete detail images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'product-details' AND auth.role() = 'authenticated');

-- 인증된 사용자만 상세 이미지 업데이트 가능
CREATE POLICY "Authenticated users can update detail images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'product-details' AND auth.role() = 'authenticated');
