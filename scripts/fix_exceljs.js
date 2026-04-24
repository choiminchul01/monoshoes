const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/\r\n/g, '\n');

// 1. Add imports if not present
if (!c.includes('import ExcelJS from "exceljs";')) {
    c = c.replace('import * as XLSX from "xlsx";', 'import * as XLSX from "xlsx";\nimport ExcelJS from "exceljs";\nimport { saveAs } from "file-saver";');
}

// 2. Rewrite downloadTemplate
const oldDownloadTemplateRegex = /    \/\/ Excel 템플릿 다운로드\n    const downloadTemplate = \(\) => \{[\s\S]*?XLSX\.writeFile\(wb, "상품등록_양식\.xlsx"\);\n        toast\.success\("템플릿이 다운로드되었습니다"\);\n    \};/;

const newDownloadTemplate = `    // Excel 템플릿 다운로드 (exceljs 적용 - 드롭다운 포함)
    const downloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("상품목록");

        // 컬럼 정의
        sheet.columns = [
            { header: "카테고리", key: "category", width: 25 },
            { header: "브랜드", key: "brand", width: 15 },
            { header: "상품명", key: "name", width: 30 },
            { header: "색상정보", key: "colors", width: 20 },
            { header: "사이즈정보", key: "sizes", width: 20 },
            { header: "특징옵션", key: "features", width: 20 },
            { header: "가격", key: "price", width: 12 },
            { header: "재고", key: "stock", width: 8 },
            { header: "베스트여부", key: "is_best", width: 10 },
            { header: "신상품여부", key: "is_new", width: 10 },
            { header: "SHOP추천여부", key: "is_celeb", width: 15 },
            { header: "특가할인율", key: "discount", width: 10 },
            { header: "상품설명", key: "description", width: 40 },
            { header: "이미지1", key: "img1", width: 60 },
            { header: "이미지2", key: "img2", width: 60 },
            { header: "이미지3", key: "img3", width: 60 },
            { header: "이미지4", key: "img4", width: 60 },
            { header: "이미지5", key: "img5", width: 60 },
            { header: "이미지6", key: "img6", width: 60 },
            { header: "이미지7", key: "img7", width: 60 },
            { header: "이미지8", key: "img8", width: 60 },
            { header: "이미지9", key: "img9", width: 60 },
            { header: "이미지10", key: "img10", width: 60 }
        ];

        // 샘플 데이터 추가
        sheet.addRow({
            category: "여성 - 플랫/로퍼",
            brand: "BRAND NAME",
            name: "샘플 상품명",
            colors: "블랙, 베이지",
            sizes: "230, 235, 240",
            features: "굽 3cm, 논슬립",
            price: 1000000,
            stock: 10,
            is_best: "N",
            is_new: "N",
            is_celeb: "N",
            discount: 0,
            description: "상품에 대한 상세 설명을 입력하세요.",
            img1: "https://...",
            img2: "",
            img3: "",
            img4: "",
            img5: "",
            img6: "",
            img7: "",
            img8: "",
            img9: "",
            img10: ""
        });

        // 1행(헤더) 스타일 지정
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).alignment = { horizontal: 'center' };
        sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // 데이터 유효성 검사 (드롭다운) 설정 (A2 ~ A1000)
        // CATEGORY_LABELS의 값들을 배열로 추출
        const categoryList = Object.values(CATEGORY_LABELS);
        // 쌍따옴표로 감싸서 드롭다운 목록 문자열 생성
        const categoryFormula = '"' + categoryList.join(',') + '"';

        const yNFormula = '"Y,N"';

        for (let i = 2; i <= 1000; i++) {
            // 카테고리 (A열) 드롭다운
            sheet.getCell(\`A\${i}\`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [categoryFormula],
                showErrorMessage: true,
                errorTitle: '잘못된 입력',
                error: '목록에서 카테고리를 선택해주세요.'
            };

            // Y/N 여부 드롭다운 (베스트, 신상, SHOP추천 - I, J, K열)
            sheet.getCell(\`I\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [yNFormula] };
            sheet.getCell(\`J\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [yNFormula] };
            sheet.getCell(\`K\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [yNFormula] };
        }

        // 파일 생성 및 다운로드
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, "상품등록_양식_드롭다운적용.xlsx");
        
        toast.success("드롭다운이 적용된 템플릿이 다운로드되었습니다.");
    };`;

if (oldDownloadTemplateRegex.test(c)) {
    c = c.replace(oldDownloadTemplateRegex, newDownloadTemplate);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Success! downloadTemplate updated to use exceljs with dropdowns.');
} else {
    console.log('Failed to match downloadTemplate regex. The file might have been modified differently.');
}
