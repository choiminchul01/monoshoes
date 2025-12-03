/**
 * Test script for RLS (Row Level Security) policies
 * Run with: node scripts/test-rls-policies.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSPolicies() {
    console.log('🔒 Testing RLS Policies...\n');

    try {
        // Test 1: Unauthenticated user cannot modify products
        console.log('Test 1: Unauthenticated user trying to insert product...');
        const { data: insertData, error: insertError } = await supabase
            .from('products')
            .insert({
                name: 'Test Product',
                brand: 'Test Brand',
                price: 10000,
                category: 'BAG',
                description: 'Test',
                stock: 1
            });

        if (insertError) {
            console.log('✅ PASS: Unauthenticated insert blocked');
            console.log(`   Error: ${insertError.message}\n`);
        } else {
            console.log('❌ FAIL: Unauthenticated user was able to insert product\n');
        }

        // Test 2: Unauthenticated user CAN view products
        console.log('Test 2: Unauthenticated user trying to view products...');
        const { data: selectData, error: selectError } = await supabase
            .from('products')
            .select('*')
            .limit(1);

        if (!selectError && selectData && selectData.length > 0) {
            console.log('✅ PASS: Public can view products');
            console.log(`   Retrieved ${selectData.length} product(s)\n`);
        } else {
            console.log('❌ FAIL: Public cannot view products');
            console.log(`   Error: ${selectError?.message}\n`);
        }

        // Test 3: Unauthenticated user cannot view all orders
        console.log('Test 3: Unauthenticated user trying to view all orders...');
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*');

        if (ordersError || !ordersData || ordersData.length === 0) {
            console.log('✅ PASS: Unauthenticated user cannot view orders');
            console.log(`   Error: ${ordersError?.message || 'No data returned'}\n`);
        } else {
            console.log('❌ FAIL: Unauthenticated user can view orders');
            console.log(`   Retrieved ${ordersData.length} order(s)\n`);
        }

        // Test 4: Admin can view all products (using service role)
        console.log('Test 4: Admin trying to view products...');
        const { data: adminProducts, error: adminError } = await supabaseAdmin
            .from('products')
            .select('*')
            .limit(5);

        if (!adminError && adminProducts && adminProducts.length > 0) {
            console.log('✅ PASS: Admin can view products');
            console.log(`   Retrieved ${adminProducts.length} product(s)\n`);
        } else {
            console.log('❌ FAIL: Admin cannot view products');
            console.log(`   Error: ${adminError?.message}\n`);
        }

        // Test 5: Check wishlist isolation
        console.log('Test 5: Checking wishlist RLS policies...');
        const { data: wishlistData, error: wishlistError } = await supabase
            .from('wishlist')
            .select('*');

        if (wishlistError || !wishlistData || wishlistData.length === 0) {
            console.log('✅ PASS: Unauthenticated user cannot view wishlists');
            console.log(`   Error: ${wishlistError?.message || 'No data returned'}\n`);
        } else {
            console.log('❌ WARNING: Unauthenticated user can view wishlists');
            console.log(`   Retrieved ${wishlistData.length} wishlist item(s)\n`);
        }

        console.log('🎉 RLS Policy Tests Complete!\n');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

testRLSPolicies();
