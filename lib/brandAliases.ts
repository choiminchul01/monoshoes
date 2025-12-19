'use server'

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// 브랜드 별칭 타입 정의
export type BrandAliases = Record<string, string[]>; // { "CELINE": ["셀린느", "셀린"], ... }

// 브랜드 별칭 저장
export async function saveBrandAliasesAction(aliases: BrandAliases) {
    try {
        const { error } = await supabaseAdmin
            .from('site_settings')
            .update({ brand_aliases: aliases })
            .eq('id', 1);

        if (error) throw error;

        revalidatePath('/admin/settings');
        revalidatePath('/shop');
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error: any) {
        console.error('Brand aliases save error:', error);
        return { success: false, error: error.message };
    }
}

// 브랜드 별칭 불러오기
export async function fetchBrandAliasesAction(): Promise<{ success: boolean; aliases?: BrandAliases; error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('brand_aliases')
            .eq('id', 1)
            .single();

        if (error) throw error;

        return { success: true, aliases: data?.brand_aliases || {} };
    } catch (error: any) {
        console.error('Brand aliases fetch error:', error);
        return { success: false, error: error.message };
    }
}
