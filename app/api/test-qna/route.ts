import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    const { data: notices, error: noticesError } = await supabaseAdmin.from('notices').select('*').limit(1);
    const { data: products, error: productsError } = await supabaseAdmin.from('products').select('*').limit(1);
    
    return NextResponse.json({
        notices: { data: notices, error: noticesError },
        products: { data: products, error: productsError }
    });
}
