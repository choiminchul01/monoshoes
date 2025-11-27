-- Check RLS policies on products table
select * from pg_policies where tablename = 'products';
