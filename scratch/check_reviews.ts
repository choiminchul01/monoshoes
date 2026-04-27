const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkReviews() {
    const { count, error } = await supabaseAdmin
        .from('reviews')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error("Error checking reviews:", error);
    } else {
        console.log(`Found ${count} reviews in the database.`);
    }
}

checkReviews();
