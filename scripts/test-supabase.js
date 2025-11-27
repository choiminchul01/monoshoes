
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually since we are running with node
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = require('dotenv').config({ path: envPath });

if (envConfig.error) {
    console.error("Error loading .env.local:", envConfig.error);
    process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductInsert() {
    console.log("Testing Product Insert...");
    const { data, error } = await supabase
        .from('products')
        .insert([
            {
                name: 'Test Product ' + Date.now(),
                brand: 'TEST',
                price: 1000,
                category: 'BAG',
                images: [],
                description: 'Test Description',
                stock: 10
            }
        ])
        .select();

    if (error) {
        console.error("❌ Product Insert Failed:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Product Insert Success:", data[0].id);
        // Clean up
        await supabase.from('products').delete().eq('id', data[0].id);
    }
}

async function testStorageUpload() {
    console.log("\nTesting Storage Upload...");
    const fileName = `test-${Date.now()}.txt`;
    const fileContent = Buffer.from('Test content');

    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, fileContent);

    if (error) {
        console.error("❌ Storage Upload Failed:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Storage Upload Success:", data.path);
        // Clean up
        await supabase.storage.from('product-images').remove([fileName]);
    }
}

async function run() {
    await testProductInsert();
    await testStorageUpload();
}

run();
