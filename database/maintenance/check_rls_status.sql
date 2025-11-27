-- Check if RLS is enabled on products table
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'products';

-- Check policies on products table
SELECT * FROM pg_policies WHERE tablename = 'products';
