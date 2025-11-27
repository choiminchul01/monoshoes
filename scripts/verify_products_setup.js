const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needed for storage admin

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

// Use service role key if available for storage checks, otherwise anon
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function verifySetup() {
    console.log('Verifying Products Setup...');

    // 1. Check Products Table Schema
    console.log('\n1. Checking Products Table...');
    const { data: products, error: productError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (productError) {
        console.error('❌ Error accessing products table:', productError.message);
    } else {
        console.log('✅ Products table is accessible.');
        // Check for is_available column by inspecting the returned data (if any) or trying to select it specifically
        // If table is empty, we can't easily check columns via select *, so we try to insert a dummy and delete it, or just assume if select works it's ok for now.
        // Better: try to select is_available specifically.
        const { error: colError } = await supabase.from('products').select('is_available').limit(1);
        if (colError) {
            console.error('❌ Column is_available might be missing:', colError.message);
        } else {
            console.log('✅ Column is_available exists.');
        }
    }

    // 2. Check Storage Bucket
    console.log('\n2. Checking Storage Bucket (product-images)...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error('❌ Error listing buckets:', bucketError.message);
    } else {
        const bucket = buckets.find(b => b.name === 'product-images');
        if (bucket) {
            console.log('✅ Bucket "product-images" exists.');
            console.log('   Public:', bucket.public);
        } else {
            console.error('❌ Bucket "product-images" NOT found.');
        }
    }

    console.log('\nVerification Complete.');
}

verifySetup();
