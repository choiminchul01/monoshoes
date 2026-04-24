const ExcelJS = require('exceljs');
const path = require('path');

async function createTestExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('상품목록');

    sheet.columns = [
        { header: '카테고리', key: 'category', width: 25 },
        { header: '브랜드', key: 'brand', width: 15 },
        { header: '상품명', key: 'name', width: 30 },
        { header: '색상정보', key: 'colors', width: 20 },
        { header: '사이즈정보', key: 'sizes', width: 20 },
        { header: '특징옵션', key: 'features', width: 20 },
        { header: '가격', key: 'price', width: 12 },
        { header: '재고', key: 'stock', width: 8 },
        { header: '베스트여부', key: 'is_best', width: 10 },
        { header: '신상품여부', key: 'is_new', width: 10 },
        { header: 'SHOP추천여부', key: 'is_celeb', width: 15 },
        { header: '특가할인율', key: 'discount', width: 10 },
        { header: '상품설명', key: 'description', width: 40 },
    ];

    // 남성 상품 테스트 데이터 (한글 레이블 방식)
    const testRows = [
        { category: '남성 - 스니커즈', brand: 'MONOSHOES', name: '테스트 남성 스니커즈 A', colors: '블랙, 화이트', sizes: '260, 265, 270, 275, 280', features: '쿠션 인솔, 논슬립', price: 55000, stock: 20, is_best: 'Y', is_new: 'Y', is_celeb: 'N', discount: 0, description: '남성 테스트 스니커즈 상품 A' },
        { category: '남성 - 구두/옥스퍼드', brand: 'MONOSHOES', name: '테스트 남성 구두 B', colors: '블랙, 브라운', sizes: '255, 260, 265, 270, 275', features: '가죽 소재, 포멀', price: 89000, stock: 15, is_best: 'N', is_new: 'Y', is_celeb: 'N', discount: 10, description: '남성 테스트 구두 상품 B' },
        { category: '남성 - 로퍼/슬립온', brand: 'MONOSHOES', name: '테스트 남성 로퍼 C', colors: '네이비, 카키', sizes: '260, 265, 270, 275', features: '슬립온, 경량', price: 67000, stock: 25, is_best: 'Y', is_new: 'N', is_celeb: 'Y', discount: 15, description: '남성 테스트 로퍼 상품 C' },
        { category: '남성 - 샌들/슬리퍼', brand: 'MONOSHOES', name: '테스트 남성 샌들 D', colors: '블랙, 베이지', sizes: '260, 265, 270, 275, 280', features: '발목 스트랩', price: 42000, stock: 30, is_best: 'N', is_new: 'Y', is_celeb: 'N', discount: 5, description: '남성 테스트 샌들 상품 D' },
        { category: '남성 - 부츠/워커', brand: 'MONOSHOES', name: '테스트 남성 부츠 E', colors: '블랙', sizes: '255, 260, 265, 270, 275, 280', features: '지퍼, 방수', price: 120000, stock: 10, is_best: 'Y', is_new: 'N', is_celeb: 'N', discount: 0, description: '남성 테스트 부츠 상품 E' },
    ];

    testRows.forEach(row => sheet.addRow(row));

    // 헤더 스타일
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const outputPath = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/테스트_남성상품_업로드.xlsx';
    await workbook.xlsx.writeFile(outputPath);
    console.log('테스트 엑셀 파일 생성 완료:', outputPath);
    console.log('총', testRows.length, '개 남성 상품 (카테고리 목록):');
    testRows.forEach(r => console.log(' -', r.category, '|', r.name));
}

createTestExcel().catch(console.error);
