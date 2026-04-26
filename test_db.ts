import { supabaseAdmin } from './lib/supabase';

async function test() {
    const { data, error } = await supabaseAdmin.from('marketing_leads').select('address_sigungu').eq('address_sido', '경기').limit(50000);
    console.log('Error:', error);
    console.log('Data length:', data?.length);
    if (data) {
        const unique = [...new Set(data.map(r => r.address_sigungu).filter(Boolean))].sort();
        console.log('Unique:', unique);
    }
}
test();
