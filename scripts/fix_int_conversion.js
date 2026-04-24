const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Function to replace the specific mapping blocks in the file
const patchCode = () => {
    // For price, stock, discount_percent
    // price: Number(item.price) || 0, -> price: Math.round(Number(item.price) || 0),
    // stock: Number(item.stock) || 0, -> stock: Math.round(Number(item.stock) || 0),
    // discount_percent: Number(item.discount_percent) || 0, -> discount_percent: Math.round((Number(item.discount_percent) > 0 && Number(item.discount_percent) <= 1) ? Number(item.discount_percent) * 100 : Number(item.discount_percent) || 0),

    // In productsToInsert
    c = c.replace(/price: Number\(item\.price\) \|\| 0,/g, 'price: Math.round(Number(item.price) || 0),');
    c = c.replace(/stock: Number\(item\.stock\) \|\| 0,/g, 'stock: Math.round(Number(item.stock) || 0),');
    c = c.replace(/discount_percent: Number\(item\.discount_percent\) \|\| 0,/g, 'discount_percent: Math.round((Number(item.discount_percent) > 0 && Number(item.discount_percent) <= 1) ? Number(item.discount_percent) * 100 : Number(item.discount_percent) || 0),');
    
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed float to int conversion logic.');
};

patchCode();
