-- ================================================================
-- FIX: Infinite Recursion & RLS Permissions for Admin
-- ================================================================

-- 1. Create a secure function to check admin status (Bypasses RLS)
-- This function runs with the privileges of the creator (postgres/admin),
-- preventing infinite recursion when policies query the admin_roles table.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'manager', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create specific check for Master role
CREATE OR REPLACE FUNCTION public.check_is_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = auth.uid()
    AND role = 'master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Orders DELETE Policy
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

CREATE POLICY "Admins can delete orders"
ON orders FOR DELETE
USING (
  -- Use the function instead of direct table access
  public.check_is_master()
);

-- 4. Update Orders UPDATE Policy (Allow Managers/Master)
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
USING (
  public.check_is_admin()
);

-- 5. Ensure admin_roles is readable by authenticated users (to prevent lookup failures)
-- Note: The exist policies might be too restrictive.
-- Let's add a policy that allows any authenticated user to read their own role 
-- AND allows the defined functions to work without RLS interference (because they are SECURITY DEFINER).

-- However, for client-side queries:
DROP POLICY IF EXISTS "Users can view own role" ON admin_roles;
CREATE POLICY "Users can view own role"
ON admin_roles FOR SELECT
USING (user_id = auth.uid());

-- Fix "Master can view all roles" to use the function to avoid recursion
DROP POLICY IF EXISTS "Master can view all roles" ON admin_roles;
CREATE POLICY "Master can view all roles"
ON admin_roles FOR SELECT
USING (
  public.check_is_master()
);

-- Fix "Master can manage roles"
DROP POLICY IF EXISTS "Master can manage roles" ON admin_roles;
CREATE POLICY "Master can manage roles"
ON admin_roles FOR ALL
USING (
  public.check_is_master()
);

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_master TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin TO service_role;
GRANT EXECUTE ON FUNCTION public.check_is_master TO service_role;

-- 7. Add Policy for Order Items DELETE (Missing in screenshot analysis but important)
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;
CREATE POLICY "Admins can delete order items"
ON order_items FOR DELETE
USING (
  public.check_is_master()
);

SELECT 'Admin RLS Fixed Successfully' as result;
