-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin Roles Table
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'staff' CHECK (role IN ('master', 'manager', 'staff')),
    permissions JSONB DEFAULT '{
        "dashboard": true,
        "customers": false,
        "orders": false,
        "products": false,
        "reviews": false,
        "board": false,
        "coupons": false,
        "inquiries": false,
        "settings": false
    }'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);

-- RLS Policies
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Master can view all roles
CREATE POLICY "Master can view all roles"
ON admin_roles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = auth.uid() AND ar.role = 'master'
    )
);

-- Master can insert/update/delete roles
CREATE POLICY "Master can manage roles"
ON admin_roles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = auth.uid() AND ar.role = 'master'
    )
);

-- Users can view their own role
CREATE POLICY "Users can view own role"
ON admin_roles FOR SELECT
USING (user_id = auth.uid());

-- Insert master account (will need to update user_id after first login)
-- Note: This is a placeholder. The actual user_id will be set after master@essentia.com creates an account
INSERT INTO admin_roles (email, role, permissions, created_by)
VALUES (
    'master@essentia.com',
    'master',
    '{
        "dashboard": true,
        "customers": true,
        "orders": true,
        "products": true,
        "reviews": true,
        "board": true,
        "coupons": true,
        "inquiries": true,
        "settings": true
    }'::jsonb,
    NULL
)
ON CONFLICT (email) DO NOTHING;

-- Function to auto-assign user_id when master account logs in
CREATE OR REPLACE FUNCTION assign_master_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If a user with master email logs in, update the admin_roles table
    IF NEW.email = 'master@essentia.com' THEN
        UPDATE admin_roles
        SET user_id = NEW.id
        WHERE email = 'master@essentia.com' AND user_id IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table (only if accessible)
-- Note: This may need to be run in Supabase dashboard as it requires superuser access
-- CREATE TRIGGER on_auth_user_created
-- AFTER INSERT ON auth.users
-- FOR EACH ROW
-- EXECUTE FUNCTION assign_master_user_id();
