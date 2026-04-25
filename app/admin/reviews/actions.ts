"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function createAdminReview(data: any) {
    try {
        const { error } = await supabaseAdmin.from("reviews").insert({
            product_id: data.product_id,
            author_name: data.author_name,
            rating: data.rating,
            content: data.content,
            image_url: data.image_url,
            is_admin_created: true
        });
        
        if (error) {
            console.error("Error in createAdminReview:", error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }
        return { success: true };
    } catch (err: any) {
        console.error("Exception in createAdminReview:", err);
        return { success: false, error: err.message || String(err) };
    }
}

export async function updateAdminReview(id: string, data: any) {
    try {
        const { error } = await supabaseAdmin.from("reviews").update({
            product_id: data.product_id,
            author_name: data.author_name,
            rating: data.rating,
            content: data.content,
            image_url: data.image_url
        }).eq("id", id);
        
        if (error) {
            console.error("Error in updateAdminReview:", error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }
        return { success: true };
    } catch (err: any) {
        console.error("Exception in updateAdminReview:", err);
        return { success: false, error: err.message || String(err) };
    }
}

export async function deleteAdminReview(id: string) {
    try {
        const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
        if (error) {
            console.error("Error in deleteAdminReview:", error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }
        return { success: true };
    } catch (err: any) {
        console.error("Exception in deleteAdminReview:", err);
        return { success: false, error: err.message || String(err) };
    }
}
