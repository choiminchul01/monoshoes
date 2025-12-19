import { BrandAliases } from './brandAliases';

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
