"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Helper to get admin client
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        throw new Error("서버 설정 오류: SERVICE_ROLE_KEY가 없습니다.");
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// --- Notices ---

export async function saveNoticeAction(formData: FormData) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: "서버 설정 오류: SERVICE_ROLE_KEY가 없습니다." };
    }
    try {
        const supabase = getAdminClient();

        const id = formData.get("id") as string | null;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const is_important = formData.get("is_important") === "true";
        const file = formData.get("file") as File | null;

        let image_url = null;

        // Handle File Upload
        if (file && file.size > 0) {
            const fileExt = file.name.split('.').pop();
            const fileName = `notice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabase.storage
                .from('notice-images')
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('notice-images')
                .getPublicUrl(fileName);

            image_url = publicUrl;
        }

        if (id) {
            // Update
            const updateData: any = {
                title,
                content,
                is_important
            };
            if (image_url) updateData.image_url = image_url;

            const { error } = await supabase
                .from("notices")
                .update(updateData)
                .eq("id", id);
            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase
                .from("notices")
                .insert({
                    title,
                    content,
                    is_important,
                    image_url // can be null
                });
            if (error) throw error;
        }

        revalidatePath("/admin/board");
        return { success: true };
    } catch (error: any) {
        console.error("Save notice error:", error);
        return { success: false, error: error.message || "알 수 없는 오류가 발생했습니다." };
    }
}

export async function deleteNoticeAction(id: string) {
    try {
        const supabase = getAdminClient();
        const { error } = await supabase
            .from("notices")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/admin/board");
        return { success: true };
    } catch (error: any) {
        console.error("Delete notice error:", error);
        return { success: false, error: error.message };
    }
}

// --- FAQs ---

export async function saveFaqAction(faq: { id?: string; category: string; question: string; answer: string; display_order: number }) {
    try {
        const supabase = getAdminClient();
        if (faq.id) {
            // Update
            const { error } = await supabase
                .from("faqs")
                .update({
                    category: faq.category,
                    question: faq.question,
                    answer: faq.answer,
                    display_order: faq.display_order
                })
                .eq("id", faq.id);
            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase
                .from("faqs")
                .insert({
                    category: faq.category,
                    question: faq.question,
                    answer: faq.answer,
                    display_order: faq.display_order
                });
            if (error) throw error;
        }

        revalidatePath("/admin/board");
        return { success: true };
    } catch (error: any) {
        console.error("Save FAQ error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteFaqAction(id: string) {
    try {
        const supabase = getAdminClient();
        const { error } = await supabase
            .from("faqs")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/admin/board");
        return { success: true };
    } catch (error: any) {
        console.error("Delete FAQ error:", error);
        return { success: false, error: error.message };
    }
}
