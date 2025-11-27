const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log('Attempting to create "product-images" bucket...');

    const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });

    if (error) {
        console.error('❌ Error creating bucket:', error.message);
        console.log('If this failed due to permissions, please run the "fix-storage-policy.sql" in your Supabase SQL Editor.');
    } else {
        console.log('✅ Bucket "product-images" created successfully.');
    }
}

createBucket();
