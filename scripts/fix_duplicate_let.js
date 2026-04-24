const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/let insertedCount = result\.insertedCount \|\| 0;/g, 'insertedCount = result.insertedCount || 0;');
c = c.replace(/let updatedCount = result\.updatedCount \|\| 0;/g, 'updatedCount = result.updatedCount || 0;');
c = c.replace(/let skippedCount = result\.skippedCount \|\| 0;/g, 'skippedCount = result.skippedCount || 0;');

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed variable declaration error.');
