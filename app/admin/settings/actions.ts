'use server'

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function uploadBannerAction(formData: FormData) {
    const file = formData.get('file') as File;
    const slotNumber = formData.get('slotNumber') as string;

    if (!file || !slotNumber) {
        return { success: false, error: 'File or slot number missing' };
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `banner_${slotNumber}.${fileExt}`;

        // Convert file to ArrayBuffer for Supabase upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error } = await supabaseAdmin.storage
            .from('banners')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) throw error;

        revalidatePath('/admin/settings');
        revalidatePath('/home');
        return { success: true };
    } catch (error: any) {
        console.error('Upload error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        return { success: false, error: `Upload failed: ${error.message}` };
    }
}

export async function deleteBannerAction(slotNumber: number) {
    try {
        // List files to find the correct extension
        const { data: files } = await supabaseAdmin.storage.from('banners').list();
        const bannerFile = files?.find(f => f.name.startsWith(`banner_${slotNumber}`));

        if (bannerFile) {
            const { error } = await supabaseAdmin.storage
                .from('banners')
                .remove([bannerFile.name]);

            if (error) throw error;
        }

        revalidatePath('/admin/settings');
        revalidatePath('/home');
        return { success: true };
    } catch (error: any) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
    }
}

export async function fetchBannersAction() {
    try {
        const { data: files, error } = await supabaseAdmin.storage.from('banners').list();

        if (error) throw error;

        const bannerUrls: { [key: number]: string } = {};

        if (files) {
            for (let i = 1; i <= 3; i++) {
                const bannerFile = files.find(f => f.name.startsWith(`banner_${i}`));
                if (bannerFile) {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                        .from('banners')
                        .getPublicUrl(bannerFile.name);
                    // Add timestamp to bust cache
                    bannerUrls[i] = `${publicUrl}?t=${new Date().getTime()}`;
                }
            }
        }

        return { success: true, banners: bannerUrls };
    } catch (error: any) {
        console.error('Fetch error:', error);
        return { success: false, error: error.message };
    }
}
