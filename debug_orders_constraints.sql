-- 1. Orders 테이블을 참조하는 모든 Foreign Key 제약조건 조회
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action
FROM
    pg_constraint c
JOIN
    pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE
    confrelid = 'orders'::regclass;

-- on_delete_action codes:
-- a = no action
-- r = restrict
-- c = cascade
-- n = set null
-- d = set default

-- 2. Orders 테이블의 RLS 정책 조회
SELECT
    tablename,
    policyname,
    cmd AS command,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'orders';
