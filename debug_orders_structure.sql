-- ================================================================
-- DEBUG: Orders Table Structure
-- 주문 테이블의 컬럼 및 외래키 제약조건을 확인합니다.
-- ================================================================

-- 1. Columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders';

-- 2. Constraints (Foreign Keys)
SELECT
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'orders' AND tc.constraint_type = 'FOREIGN KEY';
