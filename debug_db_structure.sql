-- ================================================================
-- DEBUG: Database Structure
-- 주문 테이블의 트리거와 'users' 테이블 존재 여부를 확인합니다.
-- ================================================================

-- 1. List Triggers on orders table
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_statement as action
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- 2. Check if 'users' table exists in public schema
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'users';

-- 3. Check Policies on orders
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders';
