import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('product_qna')
            .select('*')
            .limit(10);
            
        return NextResponse.json({ data, error });
    } catch (err: any) {
        return NextResponse.json({ error: err.message });
    }
}
