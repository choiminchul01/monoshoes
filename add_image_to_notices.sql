-- Add image_url column to notices table
ALTER TABLE notices ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for notice images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('notice-images', 'notice-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for notice-images

-- 1. Public can view images
DROP POLICY IF EXISTS "Public Access Notice Images" ON storage.objects;
CREATE POLICY "Public Access Notice Images" ON storage.objects 
FOR SELECT USING (bucket_id = 'notice-images');

-- 2. Authenticated users (admins) can upload images
DROP POLICY IF EXISTS "Authenticated Upload Notice Images" ON storage.objects;
CREATE POLICY "Authenticated Upload Notice Images" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'notice-images' 
    AND auth.role() = 'authenticated'
);

-- 3. Authenticated users (admins) can delete images
DROP POLICY IF EXISTS "Authenticated Delete Notice Images" ON storage.objects;
CREATE POLICY "Authenticated Delete Notice Images" ON storage.objects 
FOR DELETE USING (
    bucket_id = 'notice-images' 
    AND auth.role() = 'authenticated'
);

-- 4. Authenticated users (admins) can update images
DROP POLICY IF EXISTS "Authenticated Update Notice Images" ON storage.objects;
CREATE POLICY "Authenticated Update Notice Images" ON storage.objects 
FOR UPDATE USING (
    bucket_id = 'notice-images' 
    AND auth.role() = 'authenticated'
);
