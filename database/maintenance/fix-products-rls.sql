-- Fix RLS policies for products table

-- 1. Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Access" ON products;
DROP POLICY IF EXISTS "Admin Full Access" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;

-- 3. Allow public read access (SELECT)
CREATE POLICY "Public Read Access"
ON products FOR SELECT
USING (true);

-- 4. Allow authenticated users (admins) full access (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin Full Access"
ON products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
