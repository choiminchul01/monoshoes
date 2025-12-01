const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('Cannot verify without Service Role Key.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyPoints() {
    console.log('🚀 Starting Point System Verification...');

    try {
        // 1. Find a test user (master@essentia.com)
        console.log('1. Finding test user (master@essentia.com)...');
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) throw userError;

        const testUser = users.find(u => u.email === 'master@essentia.com');

        if (!testUser) {
            console.error('❌ Test user master@essentia.com not found.');
            return;
        }
        console.log(`   ✅ Found user: ${testUser.email} (${testUser.id})`);

        // 2. Create a test order
        console.log('2. Creating test order...');
        const orderNumber = `TEST-${Date.now()}`;
        const amount = 100000; // 100,000 KRW

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                customer_name: 'Test User',
                customer_email: testUser.email,
                customer_phone: '010-0000-0000',
                total_amount: amount,
                final_amount: amount,
                payment_status: 'pending',
                order_status: 'pending'
            })
            .select()
            .single();

        if (orderError) throw orderError;
        console.log(`   ✅ Created order: ${order.order_number} (ID: ${order.id})`);

        // 3. Confirm payment (Trigger should fire)
        console.log('3. Confirming payment...');
        const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', order.id)
            .select()
            .single();

        if (updateError) throw updateError;
        console.log(`   ✅ Payment confirmed for order ${updatedOrder.order_number}`);

        // 4. Verify points
        console.log('4. Verifying points...');

        // Give the trigger a moment to fire
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: transactions, error: pointError } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('order_id', order.id)
            .single();

        if (pointError) {
            console.error('   ❌ Point transaction not found:', pointError.message);
        } else {
            const expectedPoints = Math.floor(amount * 0.01);
            if (transactions.amount === expectedPoints) {
                console.log(`   ✅ SUCCESS! Points awarded: ${transactions.amount} (Expected: ${expectedPoints})`);
                console.log(`   Transaction ID: ${transactions.id}`);
            } else {
                console.error(`   ❌ Points mismatch. Got ${transactions.amount}, expected ${expectedPoints}`);
            }
        }

        // Cleanup (Optional)
        // await supabase.from('orders').delete().eq('id', order.id);

    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyPoints();
