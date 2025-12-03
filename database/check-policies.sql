-- Check active RLS policies for critical tables
SELECT policyname, tablename, cmd, roles
FROM pg_policies
WHERE tablename IN ('products', 'orders', 'order_items')
ORDER BY tablename, policyname;
