"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function fetchInspectionsAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from("inspections")
            .select("*")
            .order("inspection_date", { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error("Fetch inspections error:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function createInspectionAction(formData: FormData) {
    const files = formData.getAll("files") as File[];
    const inspectionDate = formData.get("inspectionDate") as string;
    const customerName = formData.get("customerName") as string;

    if (!files.length || !inspectionDate || !customerName) {
        return { success: false, error: "모든 필드를 입력해주세요." };
    }

    try {
        const uploadedUrls: string[] = [];

        // Upload all images
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split(".").pop();
            const fileName = `inspection_${Date.now()}_${i}.${fileExt}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
                .from("inspections")
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from("inspections")
                .getPublicUrl(fileName);

            uploadedUrls.push(publicUrl);
        }

        // Insert into database with image_urls array
        const { error: insertError } = await supabaseAdmin
            .from("inspections")
            .insert({
                image_url: uploadedUrls[0], // 첫 번째 이미지를 대표로
                image_urls: uploadedUrls,   // 전체 이미지 배열
                inspection_date: inspectionDate,
                customer_name: customerName,
            });

        if (insertError) throw insertError;

        revalidatePath("/admin/inspections");
        revalidatePath("/about/inspection");
        return { success: true };
    } catch (error: any) {
        console.error("Create inspection error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateInspectionAction(formData: FormData) {
    const id = formData.get("id") as string;
    const files = formData.getAll("files") as File[];
    const existingUrls = JSON.parse(formData.get("existingUrls") as string || "[]") as string[];
    const inspectionDate = formData.get("inspectionDate") as string;
    const customerName = formData.get("customerName") as string;

    if (!id || !inspectionDate || !customerName) {
        return { success: false, error: "모든 필드를 입력해주세요." };
    }

    try {
        let finalUrls = [...existingUrls];

        // Upload new images if any
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size === 0) continue; // Skip empty files

            const fileExt = file.name.split(".").pop();
            const fileName = `inspection_${Date.now()}_${i}.${fileExt}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
                .from("inspections")
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from("inspections")
                .getPublicUrl(fileName);

            finalUrls.push(publicUrl);
        }

        // Update database
        const { error: updateError } = await supabaseAdmin
            .from("inspections")
            .update({
                image_url: finalUrls[0] || null,
                image_urls: finalUrls,
                inspection_date: inspectionDate,
                customer_name: customerName,
            })
            .eq("id", id);

        if (updateError) throw updateError;

        revalidatePath("/admin/inspections");
        revalidatePath("/about/inspection");
        return { success: true };
    } catch (error: any) {
        console.error("Update inspection error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteInspectionAction(id: string, imageUrls: string[]) {
    try {
        // Delete all images from storage
        for (const imageUrl of imageUrls) {
            const fileName = imageUrl.split("/").pop();
            if (fileName) {
                await supabaseAdmin.storage
                    .from("inspections")
                    .remove([fileName]);
            }
        }

        // Delete from database
        const { error } = await supabaseAdmin
            .from("inspections")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/admin/inspections");
        revalidatePath("/about/inspection");
        return { success: true };
    } catch (error: any) {
        console.error("Delete inspection error:", error);
        return { success: false, error: error.message };
    }
}
