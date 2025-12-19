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

// 검색어를 브랜드명으로 변환 (별칭 매칭)
export function matchBrandFromAlias(searchTerm: string, aliases: BrandAliases): string | null {
    const loweredSearch = searchTerm.toLowerCase().trim();

    for (const [brandName, aliasList] of Object.entries(aliases)) {
        // 브랜드명 자체와 일치 확인
        if (brandName.toLowerCase() === loweredSearch) {
            return brandName;
        }

        // 별칭과 일치 확인
        for (const alias of aliasList) {
            if (alias.toLowerCase() === loweredSearch) {
                return brandName;
            }
        }
    }

    return null;
}

// 검색어에 해당하는 모든 브랜드명 반환 (부분 일치 포함)
export function findMatchingBrands(searchTerm: string, aliases: BrandAliases): string[] {
    const loweredSearch = searchTerm.toLowerCase().trim();
    const matchedBrands: string[] = [];

    for (const [brandName, aliasList] of Object.entries(aliases)) {
        // 브랜드명에 검색어 포함 확인
        if (brandName.toLowerCase().includes(loweredSearch)) {
            matchedBrands.push(brandName);
            continue;
        }

        // 별칭에 검색어 포함 확인
        for (const alias of aliasList) {
            if (alias.toLowerCase().includes(loweredSearch)) {
                matchedBrands.push(brandName);
                break; // 하나라도 매치되면 해당 브랜드 추가
            }
        }
    }

    return matchedBrands;
}
