require('dotenv').config({ path: '.env.local' });

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('Has Service Role Key:', !!serviceKey);
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
