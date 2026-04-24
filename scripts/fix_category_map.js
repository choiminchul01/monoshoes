const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/\r\n/g, '\n');

// Update parsedData mapping in handleBulkFileUpload to handle reverse mapping
const targetMapOld = `                    return {
                        category: row["카테고리"] || "W_FLAT",
                        brand: row["브랜드"] || "",`;

const targetMapNew = `                    // Reverse category mapping
                    let catVal = row["카테고리"] || "W_FLAT";
                    const reverseCategoryMap: Record<string, string> = Object.entries(CATEGORY_LABELS).reduce((acc, [key, value]) => {
                        acc[value as string] = key;
                        return acc;
                    }, {} as Record<string, string>);
                    
                    if (reverseCategoryMap[catVal]) {
                        catVal = reverseCategoryMap[catVal];
                    }

                    return {
                        category: catVal,
                        brand: row["브랜드"] || "",`;

if (c.includes(targetMapOld)) {
    c = c.replace(targetMapOld, targetMapNew);
} else {
    console.log('Failed to patch category mapping in handleBulkFileUpload');
}

fs.writeFileSync(path, c, 'utf8');
console.log('Success! Category mapping logic updated.');
