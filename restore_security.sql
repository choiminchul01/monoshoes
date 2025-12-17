-- ================================================================
-- RESTORE SECURITY & FIX PERMISSIONS
-- ================================================================

-- 1. Re-enable RLS (다시 보안 켜기)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. Ensure admin_roles has the correct mapping
-- 관리자 이메일(master@essentia.com)과 실제 로그인 유저(auth.users)를 연결합니다.
-- 이 쿼리는 auth.users 테이블에서 이메일이 일치하는 사용자를 찾아 admin_roles의 user_id를 업데이트합니다.

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'master@essentia.com'; -- 관리자 이메일 (필요시 수정하세요!)
    -- 만약 실제 로그인하신 이메일이 다르다면 위 값을 변경해야 합니다.
    -- 예: v_email := 'powerlace01@gmail.com';
BEGIN
    -- 1. auth.users에서 해당 이메일의 ID 찾기
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
        -- 2. admin_roles 테이블 업데이트 (또는 삽입)
        INSERT INTO admin_roles (user_id, email, role, permissions)
        VALUES (
            v_user_id, 
            v_email, 
            'master', 
            '{"dashboard": true, "customers": true, "orders": true, "products": true, "reviews": true, "board": true, "coupons": true, "inquiries": true, "settings": true}'::jsonb
        )
        ON CONFLICT (email) 
        DO UPDATE SET 
            user_id = EXCLUDED.user_id,
            role = 'master'; -- 강제로 마스터 권한 부여
            
        RAISE NOTICE 'Success: Master role linked to User ID %', v_user_id;
    ELSE
        RAISE NOTICE 'Warning: No user found with email %. Please verify your login email.', v_email;
    END IF;
END $$;

-- 3. Verify Admin Check Function (안전을 위해 다시 한 번 정의)
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

-- 4. Re-apply Policies using the secure function
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders" ON orders FOR DELETE USING (public.check_is_master());

DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;
CREATE POLICY "Admins can delete order items" ON order_items FOR DELETE USING (public.check_is_master());

-- 5. Confirmation
SELECT 
    CASE WHEN (SELECT count(*) FROM admin_roles WHERE role='master' AND user_id IS NOT NULL) > 0 
    THEN 'Security Restored & Master Account Linked!' 
    ELSE 'Security Restored, BUT Master Account NOT Linked (Check Email)' 
    END as result;
