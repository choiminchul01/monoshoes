import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productsToInsert, duplicateProducts, duplicateAction } = body;

        let insertedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        // 신규 상품 등록
        if (productsToInsert && productsToInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('products')
                .insert(productsToInsert);
            
            if (insertError) throw insertError;
            insertedCount = productsToInsert.length;
        }

        // 중복 상품 처리
        if (duplicateProducts && duplicateProducts.length > 0) {
            if (duplicateAction === 'update') {
                for (const item of duplicateProducts) {
                    if (item.existingProductId && item.updateData) {
                        const { error: updateError } = await supabaseAdmin
                            .from('products')
                            .update(item.updateData)
                            .eq('id', item.existingProductId);
                        
                        if (!updateError) {
                            updatedCount++;
                        } else {
                            console.error("Bulk update error for item:", item.existingProductId, updateError);
                        }
                    }
                }
            } else {
                skippedCount = duplicateProducts.length;
            }
        }

        return NextResponse.json({ success: true, insertedCount, updatedCount, skippedCount });
    } catch (error: any) {
        console.error("Bulk API Error:", error);
        return NextResponse.json({ success: false, error: error.message || error.details || JSON.stringify(error) }, { status: 500 });
    }
}
