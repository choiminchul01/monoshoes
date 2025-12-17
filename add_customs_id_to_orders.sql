-- ================================================================
-- Add Customs ID Column to Orders Table
-- 주문 테이블에 '개인통관고유부호(customs_id)' 컬럼이 없어서 발생하는 오류를 수정합니다.
-- ================================================================

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customs_id'
    ) THEN
        -- Add column
        ALTER TABLE orders ADD COLUMN customs_id TEXT;
        RAISE NOTICE 'Added customs_id column to orders table.';
    ELSE
        RAISE NOTICE 'customs_id column already exists.';
    END IF;
END $$;
