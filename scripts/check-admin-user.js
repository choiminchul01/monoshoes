const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmin() {
    const email = 'wolkey@essentia.com';
    console.log(`Checking admin role for: ${email}`);

    const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching admin:', error);
        return;
    }

    if (!data) {
        console.log('No admin found with this email.');
        return;
    }

    console.log('--- Admin Found ---');
    console.log('Email:', data.email);
    console.log('Role:', data.role);
    console.log('User ID:', data.user_id); // Log the user_id
    console.log('Permissions:', JSON.stringify(data.permissions, null, 2));

    // Count true permissions
    const permCount = Object.values(data.permissions).filter(v => v === true).length;
    console.log(`Total Permissions Count: ${permCount}`);
}

checkAdmin();
