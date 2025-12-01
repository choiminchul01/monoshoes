const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function updateAdminPassword() {
    console.log('🚀 Updating Admin Password...');

    try {
        // 1. Find user
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;

        const adminUser = users.find(u => u.email === 'master@essentia.com');

        if (!adminUser) {
            console.error('❌ User master@essentia.com not found.');
            return;
        }

        // 2. Update password
        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            { password: 'cksgus01!' }
        );

        if (updateError) throw updateError;

        console.log(`✅ Password updated successfully for ${adminUser.email}`);

    } catch (error) {
        console.error('❌ Failed to update password:', error);
    }
}

updateAdminPassword();
