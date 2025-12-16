'use server'

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";


// ============================================
// Main Banner Actions (Dynamic)
// ============================================

export interface MainBanner {
    id: string;
    imageUrl: string;
    link: string;
    order: number;
}

export async function uploadBannerAction(formData: FormData) {
    const file = formData.get('file') as File;
    const link = formData.get('link') as string || '';

    if (!file) {
        return { success: false, error: 'File missing' };
    }

    try {
        const fileExt = file.name.split('.').pop();
        const bannerId = `banner_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const fileName = `${bannerId}.${fileExt}`;

        // Convert file to ArrayBuffer for Supabase upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to 'banners' bucket
        const { error: uploadError } = await supabaseAdmin.storage
            .from('banners')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('banners')
            .getPublicUrl(fileName);

        const fullImageUrl = `${publicUrl}?t=${Date.now()}`;

        // Update DB
        const { data: settings } = await supabaseAdmin
            .from('site_settings')
            .select('main_banners')
            .eq('id', 1)
            .single();

        const currentBanners: MainBanner[] = settings?.main_banners || [];
        const newBanner: MainBanner = {
            id: bannerId,
            imageUrl: fullImageUrl,
            link: link,
            order: currentBanners.length
        };

        const updatedBanners = [...currentBanners, newBanner];

        const { error: dbError } = await supabaseAdmin
            .from('site_settings')
            .update({ main_banners: updatedBanners })
            .eq('id', 1);

        if (dbError) throw dbError;

        revalidatePath('/admin/settings');
        revalidatePath('/home');
        return { success: true };
    } catch (error: any) {
        console.error('Banner upload error:', error);
        return { success: false, error: `Upload failed: ${error.message}` };
    }
}

export async function deleteBannerAction(bannerId: string) {
    try {
        const { data: settings } = await supabaseAdmin
            .from('site_settings')
            .select('main_banners')
            .eq('id', 1)
            .single();

        const currentBanners: MainBanner[] = settings?.main_banners || [];
        const targetBanner = currentBanners.find(b => b.id === bannerId);

        if (!targetBanner) {
            return { success: false, error: 'Banner not found' };
        }

        // Delete from Storage
        // Extract filename from URL
        const fileName = targetBanner.imageUrl.split('/').pop()?.split('?')[0];
        if (fileName) {
            await supabaseAdmin.storage
                .from('banners')
                .remove([fileName]);
        }

        // Update DB
        const updatedBanners = currentBanners.filter(b => b.id !== bannerId);

        const { error: dbError } = await supabaseAdmin
            .from('site_settings')
            .update({ main_banners: updatedBanners })
            .eq('id', 1);

        if (dbError) throw dbError;

        revalidatePath('/admin/settings');
        revalidatePath('/home');
        return { success: true };
    } catch (error: any) {
        console.error('Delete banner error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveBannerOrderAction(banners: MainBanner[]) {
    try {
        // Normalize orders based on array index
        const orderedBanners = banners.map((b, index) => ({
            ...b,
            order: index
        }));

        const { error } = await supabaseAdmin
            .from('site_settings')
            .update({ main_banners: orderedBanners })
            .eq('id', 1);

        if (error) throw error;

        revalidatePath('/admin/settings');
        revalidatePath('/home');
        return { success: true };
    } catch (error: any) {
        console.error('Save banner order error:', error);
        return { success: false, error: error.message };
    }
}

export async function fetchBannersAction() {
    try {
        const { data: settings, error } = await supabaseAdmin
            .from('site_settings')
            .select('main_banners, banner_1_link, banner_2_link, banner_3_link')
            .eq('id', 1)
            .single();

        if (error) throw error;

        let currBanners: MainBanner[] = settings.main_banners;

        // Migration Check: If main_banners is null or empty array, check for legacy files
        if (!currBanners || !Array.isArray(currBanners) || currBanners.length === 0) {
            const { data: files } = await supabaseAdmin.storage.from('banners').list();
            const legacyBanners: MainBanner[] = [];

            if (files) {
                // Check banner_1, banner_2, banner_3
                for (let i = 1; i <= 3; i++) {
                    const legacyFile = files.find(f => f.name.startsWith(`banner_${i}.`));
                    if (legacyFile) {
                        const { data: { publicUrl } } = supabaseAdmin.storage
                            .from('banners')
                            .getPublicUrl(legacyFile.name);

                        legacyBanners.push({
                            id: `legacy_banner_${i}`, // Use this ID to track it
                            imageUrl: `${publicUrl}?t=${new Date().getTime()}`,
                            link: settings[`banner_${i}_link` as keyof typeof settings] || '',
                            order: i - 1
                        });
                    }
                }
            }

            if (legacyBanners.length > 0) {
                // Save migrated banners to DB
                console.log('Migrating legacy banners to dynamic structure...');
                await supabaseAdmin
                    .from('site_settings')
                    .update({ main_banners: legacyBanners })
                    .eq('id', 1);

                currBanners = legacyBanners;
            } else {
                currBanners = [];
            }
        }

        // Sort by order
        currBanners.sort((a, b) => a.order - b.order);

        return { success: true, banners: currBanners };
    } catch (error: any) {
        console.error('Fetch banners error:', error);
        return { success: false, error: error.message };
    }
}

// Policy Images (이용 안내 이미지) - 배송/교환/환불 규정
export async function uploadPolicyImageAction(formData: FormData) {
    const file = formData.get('file') as File;
    const imageIndex = formData.get('imageIndex') as string;

    if (!file || !imageIndex) {
        return { success: false, error: 'File or image index missing' };
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `policy_${imageIndex}.${fileExt}`;

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
        revalidatePath('/shop');
        return { success: true };
    } catch (error: any) {
        console.error('Policy image upload error:', error);
        return { success: false, error: `Upload failed: ${error.message}` };
    }
}

export async function deletePolicyImageAction(imageIndex: number) {
    try {
        const { data: files } = await supabaseAdmin.storage.from('banners').list();
        const policyFile = files?.find(f => f.name.startsWith(`policy_${imageIndex}`));

        if (policyFile) {
            const { error } = await supabaseAdmin.storage
                .from('banners')
                .remove([policyFile.name]);

            if (error) throw error;
        }

        revalidatePath('/admin/settings');
        revalidatePath('/shop');
        return { success: true };
    } catch (error: any) {
        console.error('Policy image delete error:', error);
        return { success: false, error: error.message };
    }
}

export async function fetchPolicyImagesAction() {
    try {
        const { data: files, error } = await supabaseAdmin.storage.from('banners').list();

        if (error) throw error;

        const policyUrls: string[] = [];

        if (files) {
            // Find all policy images (policy_1, policy_2, etc.)
            const policyFiles = files
                .filter(f => f.name.startsWith('policy_'))
                .sort((a, b) => a.name.localeCompare(b.name));

            for (const file of policyFiles) {
                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from('banners')
                    .getPublicUrl(file.name);
                policyUrls.push(`${publicUrl}?t=${new Date().getTime()}`);
            }
        }

        return { success: true, images: policyUrls };
    } catch (error: any) {
        console.error('Fetch policy images error:', error);
        return { success: false, error: error.message };
    }
}

// Partnership Image Actions (Multiple Support)

export async function uploadPartnershipImageAction(formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        return { success: false, error: 'File missing' };
    }

    try {
        const fileExt = file.name.split('.').pop();
        // Generate unique filename for each upload
        const fileName = `partnership_proposal_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to 'partnership' bucket
        const { error: uploadError } = await supabaseAdmin.storage
            .from('partnership')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false // Do not overwrite, allow multiple files
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('partnership')
            .getPublicUrl(fileName);

        // Fetch current settings to append
        const { data: currentSettings } = await supabaseAdmin
            .from('site_settings')
            .select('partnership_proposal_images')
            .eq('id', 1)
            .single();

        const currentImages = currentSettings?.partnership_proposal_images || [];
        const newImages = [...currentImages, publicUrl];

        // Save URL array to site_settings (partnership_proposal_images)
        // Also update legacy column just in case for backward compatibility if needed, or leave it.
        // We focus on the array column.
        const { error: dbError } = await supabaseAdmin
            .from('site_settings')
            .update({
                partnership_proposal_images: newImages,
                // Optional: sync first image to legacy column if desired, but we rely on array now
            })
            .eq('id', 1);

        if (dbError) throw dbError;

        revalidatePath('/admin/settings');
        revalidatePath('/partner/inquiry');
        return { success: true };
    } catch (error: any) {
        console.error('Partnership image upload error:', error);
        return { success: false, error: `Upload failed: ${error.message}` };
    }
}

export async function deletePartnershipImageAction(targetUrl?: string) {
    try {
        // 1. Get current images
        const { data: currentSettings } = await supabaseAdmin
            .from('site_settings')
            .select('partnership_proposal_images')
            .eq('id', 1)
            .single();

        const currentImages: string[] = currentSettings?.partnership_proposal_images || [];

        let newImages = currentImages;
        let fileToDelete = "";

        if (targetUrl) {
            // Remove specific image
            newImages = currentImages.filter(url => url !== targetUrl);

            // Extract filename from URL to delete from storage
            // URL format: .../partnership/partnership_proposal_...
            const urlParts = targetUrl.split('/');
            fileToDelete = urlParts[urlParts.length - 1];
            // Remove query params if any
            if (fileToDelete.includes('?')) {
                fileToDelete = fileToDelete.split('?')[0];
            }
        } else {
            // Safety: if no targetUrl provided (legacy behavior), maybe prompt error or delete last?
            // For safety, let's require targetUrl for deletion in multiple mode.
            return { success: false, error: "Target image URL is required for deletion." };
        }

        // 2. Update DB
        const { error: dbError } = await supabaseAdmin
            .from('site_settings')
            .update({ partnership_proposal_images: newImages })
            .eq('id', 1);

        if (dbError) throw dbError;

        // 3. Delete from Storage if file name found
        if (fileToDelete) {
            const { error: storageError } = await supabaseAdmin.storage
                .from('partnership')
                .remove([fileToDelete]);

            if (storageError) {
                console.error("Storage delete warning:", storageError);
                // We don't fail the action if DB update succeeded, just log warning
            }
        }

        revalidatePath('/admin/settings');
        revalidatePath('/partner/inquiry');
        return { success: true };
    } catch (error: any) {
        console.error('Partnership image delete error:', error);
        return { success: false, error: `Delete failed: ${error.message}` };
    }
}

export async function fetchPartnershipImageAction() { // Name kept same but returns array in structure
    try {
        const { data, error } = await supabaseAdmin
            .from('site_settings')
            .select('partnership_proposal_images, partnership_proposal_image') // Select both for fallback
            .eq('id', 1)
            .single();

        if (error) throw error;

        // Priority: Array column -> Legacy column wrapped in array -> Empty array
        let images: string[] = [];

        if (data.partnership_proposal_images && Array.isArray(data.partnership_proposal_images)) {
            images = data.partnership_proposal_images;
        } else if (data.partnership_proposal_image) {
            images = [data.partnership_proposal_image];
        }

        return { success: true, imageUrls: images }; // Changed key to imageUrls
    } catch (error: any) {
        console.error('Partnership image fetch error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// PWA 아이콘 관리 액션
// ============================================

export async function uploadPWAIconAction(formData: FormData) {
    const file = formData.get('file') as File;
    const size = formData.get('size') as string; // '192' or '512'

    if (!file || !size) {
        return { success: false, error: 'File or size missing' };
    }

    try {
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        // 이미지 파일만 허용
        if (!['png', 'jpg', 'jpeg', 'webp'].includes(fileExt || '')) {
            return { success: false, error: 'PNG, JPG, WEBP 이미지만 업로드 가능합니다.' };
        }

        const fileName = `pwa_icon_${size}x${size}.${fileExt}`;

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

        // public 폴더에도 복사 (Next.js에서 직접 서빙용)
        // Note: 실제 프로덕션에서는 Supabase URL을 manifest.json에서 사용하거나
        // 빌드 시 복사하는 방식을 권장

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('PWA icon upload error:', error);
        return { success: false, error: `업로드 실패: ${error.message}` };
    }
}

export async function deletePWAIconAction(size: string) {
    try {
        // List files to find the correct extension
        const { data: files } = await supabaseAdmin.storage.from('banners').list();
        const iconFile = files?.find(f => f.name.startsWith(`pwa_icon_${size}x${size}`));

        if (iconFile) {
            const { error } = await supabaseAdmin.storage
                .from('banners')
                .remove([iconFile.name]);

            if (error) throw error;
        }

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('PWA icon delete error:', error);
        return { success: false, error: error.message };
    }
}

export async function fetchPWAIconsAction() {
    try {
        const { data: files, error } = await supabaseAdmin.storage.from('banners').list();

        if (error) throw error;

        const icons: { [key: string]: string } = {};

        if (files) {
            ['192', '512'].forEach(size => {
                const iconFile = files.find(f => f.name.startsWith(`pwa_icon_${size}x${size}`));
                if (iconFile) {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                        .from('banners')
                        .getPublicUrl(iconFile.name);
                    icons[size] = `${publicUrl}?t=${new Date().getTime()}`;
                }
            });
        }

        return { success: true, icons };
    } catch (error: any) {
        console.error('PWA icons fetch error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 브랜드 로고 관리 액션
// ============================================

interface BrandLogo {
    name: string;
    imageUrl: string | null;
    order: number;
}

export async function uploadBrandLogoAction(formData: FormData) {
    const file = formData.get('file') as File;
    const brandName = formData.get('brandName') as string;
    const order = formData.get('order') as string;

    if (!file || !brandName) {
        return { success: false, error: '파일 또는 브랜드명이 없습니다.' };
    }

    try {
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (!['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fileExt || '')) {
            return { success: false, error: 'PNG, JPG, WEBP, SVG 이미지만 업로드 가능합니다.' };
        }

        // 1. Check for existing brand
        const { data: existingBrand } = await supabaseAdmin
            .from('brand_logos')
            .select('*')
            .eq('name', brandName)
            .single();

        // 2. Delete old image if exists
        if (existingBrand?.image_url) {
            const oldFileName = existingBrand.image_url.split('/').pop()?.split('?')[0];
            if (oldFileName) {
                try {
                    await supabaseAdmin.storage
                        .from('banners')
                        .remove([oldFileName]);
                } catch (e) {
                    console.error("Old image delete failed (non-fatal):", e);
                }
            }
        }

        // 3. Upload new file
        const fileName = `brand_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('banners')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('banners')
            .getPublicUrl(fileName);

        // 4. Upsert into brand_logos table
        const { error: dbError } = await supabaseAdmin
            .from('brand_logos')
            .upsert({
                name: brandName,
                image_url: publicUrl,
                order: order ? parseInt(order) : 999
            }, { onConflict: 'name' });

        if (dbError) throw dbError;

        revalidatePath('/admin/settings');
        revalidatePath('/home');
        return { success: true };
    } catch (error: any) {
        console.error('Brand logo upload error:', error);
        return { success: false, error: `업로드 실패: ${error.message}` };
    }
}

export async function deleteBrandLogoAction(brandName: string) {
    try {
        // 1. Get info to delete file
        const { data: targetBrand } = await supabaseAdmin
            .from('brand_logos')
            .select('*')
            .eq('name', brandName)
            .single();

        if (targetBrand?.image_url) {
            const fileName = targetBrand.image_url.split('/').pop()?.split('?')[0];
            if (fileName) {
                await supabaseAdmin.storage
                    .from('banners')
                    .remove([fileName]);
            }
        }

        // 2. Delete from DB
        const { error } = await supabaseAdmin
            .from('brand_logos')
            .delete()
            .eq('name', brandName);

        if (error) throw error;

        revalidatePath('/admin/settings');
        revalidatePath('/home');
        return { success: true };
    } catch (error: any) {
        console.error('Brand logo delete error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveBrandLogosAction(brands: BrandLogo[]) {
    try {
        // Prepare batch upsert
        const updates = brands.map(b => ({
            name: b.name,
            image_url: b.imageUrl,
            order: b.order
        }));

        const { error } = await supabaseAdmin
            .from('brand_logos')
            .upsert(updates, { onConflict: 'name' });

        if (error) throw error;

        revalidatePath('/admin/settings');
        revalidatePath('/home');
        return { success: true };
    } catch (error: any) {
        console.error('Brand logos save error:', error);
        return { success: false, error: error.message };
    }
}

export async function fetchBrandLogosAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('brand_logos')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        // Map database columns to BrandLogo interface
        const logos: BrandLogo[] = (data || []).map(row => ({
            name: row.name,
            imageUrl: row.image_url,
            order: row.order
        }));

        return { success: true, logos };
    } catch (error: any) {
        console.error('Brand logos fetch error:', error);
        return { success: false, error: error.message };
    }
}
