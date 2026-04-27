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
