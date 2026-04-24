const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdminRoles() {
  console.log('Setting up admin_roles table...');

  // 1. Create the table using SQL (via service role)
  // Note: We'll use a direct insert first to see if table exists, if not we'll try to create it
  // Since we don't have a direct 'create table' JS method, we'll use RPC or assuming it exists from previous setup attempts
  // Better yet, I'll provide a script that tries to insert. 
  
  // Actually, I'll use the SQL editor approach for table creation to be safe, 
  // but I'll try to insert the user record now.
  
  const email = 'admin@monoshoes.kr';
  
  // Find user ID from auth.users (via listUsers)
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  const user = usersData.users.find(u => u.email === email);
  
  if (!user) {
    console.error('User not found. Please run create_admin.js first.');
    return;
  }

  console.log(`Found user ID: ${user.id}`);

  // Create table if not exists (using raw SQL)
  const { error: sqlError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS admin_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable RLS
      ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
      
      -- Admin role policies
      DROP POLICY IF EXISTS "Admins can view all roles" ON admin_roles;
      CREATE POLICY "Admins can view all roles" ON admin_roles FOR SELECT USING (true);
    `
  });

  // If RPC is not available, we'll just try to insert and hope the table was created by the user earlier or via setup-database.sql
  // Actually, I'll just try to insert the record.
  const { data: inserted, error: insertError } = await supabase
    .from('admin_roles')
    .upsert([
      { 
        user_id: user.id,
        email: email,
        role: 'admin'
      }
    ], { onConflict: 'email' })
    .select();

  if (insertError) {
    console.error('Error inserting admin role:', insertError.message);
    if (insertError.message.includes('relation "admin_roles" does not exist')) {
      console.log('CRITICAL: admin_roles table does not exist. Please run the SQL in Supabase SQL Editor first!');
    }
  } else {
    console.log('Admin role granted successfully to:', email);
  }
}

setupAdminRoles();
