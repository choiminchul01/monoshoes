-- ================================================================
-- DEBUG: Triggers and Users Table (Simplified)
-- ================================================================

SELECT 
    'Trigger' as type,
    trigger_name as name,
    event_manipulation as details
FROM information_schema.triggers
WHERE event_object_table = 'orders'

UNION ALL

SELECT 
    'Table' as type,
    table_name as name,
    table_schema as details
FROM information_schema.tables 
WHERE table_name = 'users';
