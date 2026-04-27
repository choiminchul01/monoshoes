"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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
    console.log("=== [SERVER] Attempting to delete product:", id);
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in server environment");
        }

        const { error, data } = await supabaseAdmin
            .from("products")
            .delete()
            .eq("id", id)
            .select();
            
        if (error) {
            console.error("=== [SERVER] Delete Error:", error);
            throw error;
        }
        
        if (!data || data.length === 0) {
            console.warn("=== [SERVER] No product found with ID:", id);
            throw new Error("삭제할 상품을 찾지 못했습니다. 이미 삭제되었거나 ID가 잘못되었습니다.");
        }
        
        console.log("=== [SERVER] Successfully deleted product:", data[0].name);
        revalidatePath("/admin/products");
        return { success: true, count: data.length };
    } catch (error: any) {
        console.error("=== [SERVER] Final Catch Error:", error);
        return { success: false, error: error.message };
    }
}
export async function deleteProductsBulkAction(ids: string[]) {
    console.log("=== [SERVER] Attempting bulk delete for IDs:", ids.length, "items");
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in server environment");
        }

        const { error, data } = await supabaseAdmin
            .from("products")
            .delete()
            .in("id", ids)
            .select();
            
        if (error) {
            console.error("=== [SERVER] Bulk Delete Error:", error);
            throw error;
        }
        
        if (!data || data.length === 0) {
            console.warn("=== [SERVER] No products were deleted");
            throw new Error("삭제할 상품을 찾지 못했습니다.");
        }
        
        console.log(`=== [SERVER] Successfully deleted ${data.length} products`);
        revalidatePath("/admin/products");
        return { success: true, count: data.length };
    } catch (error: any) {
        console.error("=== [SERVER] Bulk Delete Catch Error:", error);
        return { success: false, error: error.message };
    }
}
