"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function saveProductAction(productData: any, id?: string) {
    try {
        if (id) {
            // 수정
            const { data, error } = await supabaseAdmin
                .from("products")
                .update(productData)
                .eq("id", id)
                .select();
            if (error) throw error;
            return { success: true, data };
        } else {
            // 추가
            const { data, error } = await supabaseAdmin
                .from("products")
                .insert([productData])
                .select();
            if (error) throw error;
            return { success: true, data };
        }
    } catch (error: any) {
        console.error("Error in saveProductAction:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteProductAction(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from("products")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteProductAction:", error);
        return { success: false, error: error.message };
    }
}
