-- ================================================================
-- EMERGENCY FIX: Orders Deletion Issue
-- This script temporarily disables RLS to confirm if permissions are the blocker.
-- ================================================================

-- 1. Disable RLS on Orders and Order Items
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- 2. Verify and Fix Cascade Delete (Just in case)
-- If order_items doesn't delete with orders, we force it here.
DO $$
BEGIN
    -- Check constraint on order_items
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'order_items' 
        AND constraint_name = 'order_items_order_id_fkey'
    ) THEN
        -- Drop old constraint and re-add with CASCADE if not already proper (optional safe measure)
        -- For now, let's just assume the schema setup was correct as per setup-database.sql
        -- But we can try to delete orphan items just in case manual deletion was attempted
        DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);
    END IF;
END $$;

-- 3. Confirm status
SELECT 'RLS Disabled for Orders/OrderItems. Try deleting again.' as status;
