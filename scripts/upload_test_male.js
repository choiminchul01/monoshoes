const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CATEGORIES = [
    "W_SLINGBACK", "W_FLAT", "W_HEELS", "W_SANDAL", "W_SNEAKERS", "W_BOOTS", "W_RAIN",
    "M_OXFORD", "M_LOAFER", "M_SNEAKERS", "M_SANDAL", "M_BOOTS", "M_CASUAL", "M_RAIN"
];

const CATEGORY_LABELS = {
    "W_SLINGBACK": "여성 - 슬링백/뮬", "W_FLAT": "여성 - 플랫/로퍼",
    "W_HEELS": "여성 - 펌프스/힐", "W_SANDAL": "여성 - 샌들/슬리퍼",
    "W_SNEAKERS": "여성 - 스니커즈", "W_BOOTS": "여성 - 부츠/워커",
    "W_RAIN": "여성 - 레인부츠", "M_OXFORD": "남성 - 구두/옥스퍼드",
    "M_LOAFER": "남성 - 로퍼/슬립온", "M_SNEAKERS": "남성 - 스니커즈",
    "M_SANDAL": "남성 - 샌들/슬리퍼", "M_BOOTS": "남성 - 부츠/워커",
    "M_CASUAL": "남성 - 캐주얼화", "M_RAIN": "남성 - 레인부츠"
};

const reverseCategoryMap = Object.entries(CATEGORY_LABELS).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});

async function uploadTestProducts() {
    const filePath = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/테스트_남성상품_업로드.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const products = jsonData.map(row => {
        let catVal = String(row['카테고리'] || '').trim();
        if (reverseCategoryMap[catVal]) catVal = reverseCategoryMap[catVal];
        else if (CATEGORIES.includes(catVal.toUpperCase())) catVal = catVal.toUpperCase();
        else catVal = 'W_FLAT';

        const finalCat = CATEGORIES.includes(catVal.toUpperCase()) ? catVal.toUpperCase() : 'W_FLAT';

        return {
            name: String(row['상품명'] || ''),
            brand: String(row['브랜드'] || '').toUpperCase(),
            price: Math.round(Number(row['가격']) || 0),
            category: finalCat,
            stock: Math.round(Number(row['재고']) || 0),
            is_available: (Number(row['재고']) || 0) > 0,
            description: String(row['상품설명'] || ''),
            is_best: String(row['베스트여부']).toUpperCase() === 'Y',
            is_new: String(row['신상품여부']).toUpperCase() === 'Y',
            is_celeb_pick: String(row['SHOP추천여부']).toUpperCase() === 'Y',
            discount_percent: Math.round(Number(row['특가할인율']) || 0),
            images: [],
            detail_images: [],
            details: { colors: [], sizes: [], features: [] }
        };
    }).filter(p => p.name && p.brand && p.price > 0);

    console.log(`\n업로드할 상품 ${products.length}개:`);
    products.forEach(p => console.log(` - [${p.category}] ${p.brand} / ${p.name}`));

    const { error } = await supabase.from('products').insert(products);
    if (error) {
        console.error('\n❌ 업로드 실패:', error.message);
    } else {
        console.log('\n✅ 업로드 성공!');
        
        // 업로드 후 DB 확인
        const { data: maleProds } = await supabase.from('products').select('name, category').like('category', 'M_%').order('created_at', { ascending: false }).limit(10);
        console.log('\nDB 내 남성 상품 확인:');
        maleProds?.forEach(p => console.log(` ✅ [${p.category}] ${p.name}`));
    }
}

uploadTestProducts();
