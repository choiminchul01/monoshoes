-- 개발용: 모든 권한 허용 정책 (복사해서 Supabase SQL Editor에서 실행하세요)

-- 1. products 테이블: 모든 사용자에게 모든 권한(읽기/쓰기/수정/삭제) 허용
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."products";
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON "public"."products";
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON "public"."products";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."products";
DROP POLICY IF EXISTS "Enable all access for all users" ON "public"."products";

CREATE POLICY "Enable all access for all users" ON "public"."products"
FOR ALL USING (true) WITH CHECK (true);


-- 2. Storage: product-images 버킷에 대해 모든 사용자에게 모든 권한 허용
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Enable all access for product-images" ON storage.objects;

CREATE POLICY "Enable all access for product-images" ON storage.objects
FOR ALL USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
