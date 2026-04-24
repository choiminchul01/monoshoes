const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'admin@monoshoes.kr';
  const password = 'admin1234!';

  console.log(`Creating admin user: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User already exists. Updating password instead...');
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        // Find user first
        (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email).id,
        { password: password }
      );
      if (updateError) console.error('Error updating password:', updateError);
      else console.log('Password updated successfully.');
    } else {
      console.error('Error creating user:', error.message);
    }
  } else {
    console.log('Admin user created successfully!');
    console.log('ID:', data.user.id);
  }
}

createAdminUser();
