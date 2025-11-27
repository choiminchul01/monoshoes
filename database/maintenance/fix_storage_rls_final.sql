-- 🔧 이미지 표시 문제 해결 - Storage RLS 수정
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 storage.objects 정책 모두 삭제
DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- 2. product-images 버킷에 대한 완전한 접근 허용
CREATE POLICY "Allow all for product-images"
ON storage.objects
FOR ALL
USING (bucket_id = 'product-images');

-- 3. 확인
SELECT * FROM storage.objects WHERE bucket_id = 'product-images' LIMIT 5;
