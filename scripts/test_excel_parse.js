const XLSX = require('xlsx');

const CATEGORIES = [
    "W_SLINGBACK", "W_FLAT", "W_HEELS", "W_SANDAL", "W_SNEAKERS", "W_BOOTS", "W_RAIN",
    "M_OXFORD", "M_LOAFER", "M_SNEAKERS", "M_SANDAL", "M_BOOTS", "M_CASUAL", "M_RAIN"
];

const CATEGORY_LABELS = {
    "W_SLINGBACK": "여성 - 슬링백/뮬",
    "W_FLAT": "여성 - 플랫/로퍼",
    "W_HEELS": "여성 - 펌프스/힐",
    "W_SANDAL": "여성 - 샌들/슬리퍼",
    "W_SNEAKERS": "여성 - 스니커즈",
    "W_BOOTS": "여성 - 부츠/워커",
    "W_RAIN": "여성 - 레인부츠",
    "M_OXFORD": "남성 - 구두/옥스퍼드",
    "M_LOAFER": "남성 - 로퍼/슬립온",
    "M_SNEAKERS": "남성 - 스니커즈",
    "M_SANDAL": "남성 - 샌들/슬리퍼",
    "M_BOOTS": "남성 - 부츠/워커",
    "M_CASUAL": "남성 - 캐주얼화",
    "M_RAIN": "남성 - 레인부츠"
};

// 역방향 맵
const reverseCategoryMap = Object.entries(CATEGORY_LABELS).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});

const filePath = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/테스트_남성상품_업로드.xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(sheet);

console.log('파싱된 데이터 카테고리 변환 결과:');
console.log('='.repeat(60));

jsonData.forEach((row, i) => {
    let catVal = String(row['카테고리'] || '').trim();
    const originalCat = catVal;

    if (reverseCategoryMap[catVal]) {
        catVal = reverseCategoryMap[catVal];
        console.log(`✅ 행 ${i+1}: "${originalCat}" → "${catVal}" (한글→코드 변환 성공)`);
    } else if (CATEGORIES.includes(catVal.toUpperCase())) {
        catVal = catVal.toUpperCase();
        console.log(`✅ 행 ${i+1}: "${originalCat}" → "${catVal}" (코드 직접 입력)`);
    } else {
        catVal = 'W_FLAT';
        console.log(`❌ 행 ${i+1}: "${originalCat}" → "W_FLAT" (매핑 실패! 여성으로 강제 변환됨)`);
    }

    // 최종 insert 단계 검증
    const finalCat = CATEGORIES.includes(String(catVal || '').toUpperCase()) ? String(catVal || '').toUpperCase() : 'W_FLAT';
    const gender = finalCat.startsWith('M_') ? '남성' : '여성';
    console.log(`   → DB 저장값: "${finalCat}" [${gender}] | 상품명: ${row['상품명']}`);
});

console.log('='.repeat(60));
