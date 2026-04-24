const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Update BulkProductData interface
const oldInterface = `type BulkProductData = {
    name: string;
    brand: string;
    price: number;
    category: string;
    stock: number;
    colors: string;
    sizes: string;
    features: string;
    description: string;
    images: string[]; // 메인 이미지 URL (이미지1-2, 최대 2개)
    detailImages: string[]; // 상세페이지 이미지 URL (이미지3-10, 최대 8개)
    // 중복 체크 관련
    isDuplicate?: boolean;
    existingProductId?: string;
};`;

const newInterface = `type BulkProductData = {
    name: string;
    brand: string;
    price: number;
    category: string;
    stock: number;
    colors: string;
    sizes: string;
    features: string;
    description: string;
    images: string[];
    detailImages: string[];
    is_best?: boolean;
    is_new?: boolean;
    is_celeb_pick?: boolean;
    discount_percent?: number;
    isDuplicate?: boolean;
    existingProductId?: string;
};`;

if (c.includes(oldInterface)) {
    c = c.replace(oldInterface, newInterface);
} else {
    console.log('Failed to replace BulkProductData interface');
}

// 2. Update downloadTemplate function
const oldDownloadTemplate = `    // Excel 템플릿 다운로드
    const downloadTemplate = () => {
        const templateData = [
            {
                "카테고리": "W_FLAT",
                "브랜드": "BRAND NAME",
                "상품명": "샘플 상품명",
                "색상정보": "Black, White",
                "사이즈정보": "S, M, L",
                "가격": 1000000,
                "재고": 10,
                "상품설명": "상품에 대한 상세 설명을 입력하세요.",
                "이미지1": "https://xxx.supabase.co/storage/v1/object/public/product-images/sample1.jpg",
                "이미지2": "",
                "이미지3": "",
                "이미지4": "",
                "이미지5": "",
                "이미지6": "",
                "이미지7": "",
                "이미지8": "",
                "이미지9": "",
                "이미지10": ""
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "상품목록");

        // 열 너비 설정
        ws['!cols'] = [
            { wch: 12 }, // 카테고리
            { wch: 15 }, // 브랜드
            { wch: 20 }, // 상품명
            { wch: 20 }, // 색상정보
            { wch: 15 }, // 사이즈정보
            { wch: 12 }, // 가격
            { wch: 8 },  // 재고
            { wch: 40 }, // 상품설명
            { wch: 60 }, // 이미지1
            { wch: 60 }, // 이미지2
            { wch: 60 }, // 이미지3
            { wch: 60 }, // 이미지4
            { wch: 60 }, // 이미지5
            { wch: 60 }, // 이미지6
            { wch: 60 }, // 이미지7
            { wch: 60 }, // 이미지8
            { wch: 60 }, // 이미지9
            { wch: 60 }, // 이미지10
        ];

        XLSX.writeFile(wb, "상품등록_양식.xlsx");
        toast.success("템플릿이 다운로드되었습니다 (이미지 URL 칸럼 포함)");
    };`;

const newDownloadTemplate = `    // Excel 템플릿 다운로드
    const downloadTemplate = () => {
        const templateData = [
            {
                "카테고리": "W_FLAT",
                "브랜드": "BRAND NAME",
                "상품명": "샘플 상품명",
                "색상정보": "블랙, 베이지",
                "사이즈정보": "230, 235, 240",
                "특징옵션": "굽 3cm, 논슬립",
                "가격": 1000000,
                "재고": 10,
                "베스트여부": "N",
                "신상품여부": "N",
                "SHOP추천여부": "N",
                "특가할인율": 0,
                "상품설명": "상품에 대한 상세 설명을 입력하세요.",
                "이미지1": "https://...",
                "이미지2": "",
                "이미지3": "",
                "이미지4": "",
                "이미지5": "",
                "이미지6": "",
                "이미지7": "",
                "이미지8": "",
                "이미지9": "",
                "이미지10": ""
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "상품목록");

        // 열 너비 설정
        ws['!cols'] = [
            { wch: 12 }, // 카테고리
            { wch: 15 }, // 브랜드
            { wch: 20 }, // 상품명
            { wch: 20 }, // 색상정보
            { wch: 20 }, // 사이즈정보
            { wch: 20 }, // 특징옵션
            { wch: 12 }, // 가격
            { wch: 8 },  // 재고
            { wch: 10 }, // 베스트여부
            { wch: 10 }, // 신상품여부
            { wch: 12 }, // SHOP추천여부
            { wch: 10 }, // 특가할인율
            { wch: 40 }, // 상품설명
            { wch: 60 }, // 이미지1-10...
            { wch: 60 }, { wch: 60 }, { wch: 60 }, { wch: 60 },
            { wch: 60 }, { wch: 60 }, { wch: 60 }, { wch: 60 }, { wch: 60 },
        ];

        XLSX.writeFile(wb, "상품등록_양식.xlsx");
        toast.success("템플릿이 다운로드되었습니다");
    };`;

if (c.includes(oldDownloadTemplate)) {
    c = c.replace(oldDownloadTemplate, newDownloadTemplate);
} else {
    console.log('Failed to replace downloadTemplate function');
}

// 3. Update parsed data mapping in handleBulkFileUpload
const oldParsedDataMapping = `                    return {
                        category: row["카테고리"] || "W_FLAT",
                        brand: row["브랜드"] || "",
                        name: row["상품명"] || "",
                        colors: row["색상정보"] || "",
                        sizes: row["사이즈정보"] || "",
                        price: Number(row["가격"]) || 0,
                        stock: Number(row["재고"]) || 0,
                        features: "",
                        description: row["상품설명"] || "",
                        images: mainImageUrls,
                        detailImages: detailImageUrls,
                    };`;

const newParsedDataMapping = `                    return {
                        category: row["카테고리"] || "W_FLAT",
                        brand: row["브랜드"] || "",
                        name: row["상품명"] || "",
                        colors: row["색상정보"] || "",
                        sizes: row["사이즈정보"] || "",
                        features: row["특징옵션"] || "",
                        price: Number(row["가격"]) || 0,
                        stock: Number(row["재고"]) || 0,
                        is_best: String(row["베스트여부"]).toUpperCase() === "Y",
                        is_new: String(row["신상품여부"]).toUpperCase() === "Y",
                        is_celeb_pick: String(row["SHOP추천여부"]).toUpperCase() === "Y",
                        discount_percent: Number(row["특가할인율"]) || 0,
                        description: row["상품설명"] || "",
                        images: mainImageUrls,
                        detailImages: detailImageUrls,
                    };`;

if (c.includes(oldParsedDataMapping)) {
    c = c.replace(oldParsedDataMapping, newParsedDataMapping);
} else {
    console.log('Failed to replace parsed data mapping');
}

// 4. Update executeBulkUpload - newProducts mapping
const oldNewProductsMapping = `            // 신규 상품 등록
            if (newProducts.length > 0) {
                const productsToInsert = newProducts.map(item => ({
                    name: item.name,
                    brand: item.brand.toUpperCase(),
                    price: item.price,
                    category: CATEGORIES.includes(item.category.toUpperCase()) ? item.category.toUpperCase() : "W_FLAT",
                    stock: item.stock,
                    is_available: item.stock > 0,
                    description: item.description,
                    images: item.images || [],
                    detail_images: item.detailImages || [],
                    details: {
                        colors: item.colors ? [{ name: item.colors, value: "#000000" }] : [],
                        sizes: item.sizes ? item.sizes.split(",").map(s => s.trim()) : [],
                        features: [],
                    }
                }));`;

const newNewProductsMapping = `            // 신규 상품 등록
            if (newProducts.length > 0) {
                const productsToInsert = newProducts.map(item => ({
                    name: item.name,
                    brand: item.brand.toUpperCase(),
                    price: item.price,
                    category: CATEGORIES.includes(item.category.toUpperCase()) ? item.category.toUpperCase() : "W_FLAT",
                    stock: item.stock,
                    is_available: item.stock > 0,
                    description: item.description,
                    is_best: item.is_best || false,
                    is_new: item.is_new || false,
                    is_celeb_pick: item.is_celeb_pick || false,
                    discount_percent: item.discount_percent || 0,
                    images: item.images || [],
                    detail_images: item.detailImages || [],
                    details: {
                        colors: item.colors ? item.colors.split(",").map(c => ({ name: c.trim(), value: c.trim() })) : [],
                        sizes: item.sizes ? item.sizes.split(",").map(s => s.trim()) : [],
                        features: item.features ? item.features.split(",").map(f => f.trim()) : [],
                    }
                }));`;

if (c.includes(oldNewProductsMapping)) {
    c = c.replace(oldNewProductsMapping, newNewProductsMapping);
} else {
    console.log('Failed to replace newProducts mapping');
}

// 5. Update executeBulkUpload - duplicateProducts mapping
const oldDuplicateProductsMapping = `                                .update({
                                    price: item.price,
                                    stock: item.stock,
                                    is_available: item.stock > 0,
                                    description: item.description,
                                    images: item.images || [],
                                    detail_images: item.detailImages || [],
                                    details: {
                                        colors: item.colors ? [{ name: item.colors, value: "#000000" }] : [],
                                        sizes: item.sizes ? item.sizes.split(",").map(s => s.trim()) : [],
                                        features: [],
                                    }
                                })`;

const newDuplicateProductsMapping = `                                .update({
                                    price: item.price,
                                    stock: item.stock,
                                    is_available: item.stock > 0,
                                    description: item.description,
                                    is_best: item.is_best || false,
                                    is_new: item.is_new || false,
                                    is_celeb_pick: item.is_celeb_pick || false,
                                    discount_percent: item.discount_percent || 0,
                                    images: item.images || [],
                                    detail_images: item.detailImages || [],
                                    details: {
                                        colors: item.colors ? item.colors.split(",").map(c => ({ name: c.trim(), value: c.trim() })) : [],
                                        sizes: item.sizes ? item.sizes.split(",").map(s => s.trim()) : [],
                                        features: item.features ? item.features.split(",").map(f => f.trim()) : [],
                                    }
                                })`;

if (c.includes(oldDuplicateProductsMapping)) {
    c = c.replace(oldDuplicateProductsMapping, newDuplicateProductsMapping);
} else {
    console.log('Failed to replace duplicateProducts mapping');
}

fs.writeFileSync(path, c, 'utf8');
console.log('Success! Bulk upload logic and template updated.');
