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
    const file = formData.get("file") as File;
    const inspectionDate = formData.get("inspectionDate") as string;
    const customerName = formData.get("customerName") as string;

    if (!file || !inspectionDate || !customerName) {
        return { success: false, error: "모든 필드를 입력해주세요." };
    }

    try {
        // Upload image to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `inspection_${Date.now()}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from("inspections")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from("inspections")
            .getPublicUrl(fileName);

        // Insert into database
        const { error: insertError } = await supabaseAdmin
            .from("inspections")
            .insert({
                image_url: publicUrl,
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

export async function deleteInspectionAction(id: string, imageUrl: string) {
    try {
        // Extract filename from URL
        const fileName = imageUrl.split("/").pop();

        if (fileName) {
            // Delete from storage
            await supabaseAdmin.storage
                .from("inspections")
                .remove([fileName]);
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
