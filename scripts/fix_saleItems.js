const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/home/page.tsx';
let c = fs.readFileSync(path, 'utf8');

const regex = /const recommendedItems = products\.filter\(p =>\s*new Date\(p\.created_at\) >= ninetyDaysAgo\s*\);/;

if (regex.test(c)) {
    c = c.replace(regex, `const recommendedItems = products.filter(p => new Date(p.created_at) >= ninetyDaysAgo);\n\n  // SPECIAL PRICE: discount_percent > 0 인 상품\n  const saleItems = products.filter(p => p.discount_percent && p.discount_percent > 0);`);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed saleItems declaration.');
} else {
    console.log('Regex did not match.');
}
