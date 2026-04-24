const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix 1: Add overflow-x-auto inside the bg-white container
const oldWrapper = '<div className="bg-white rounded-lg shadow overflow-hidden mb-8">';
const newWrapper = '<div className="bg-white rounded-lg shadow overflow-hidden mb-8"><div className="overflow-x-auto">';

if (c.includes(oldWrapper)) {
    c = c.replace(oldWrapper, newWrapper);
    console.log('Fix 1 applied: overflow-x-auto wrapper added');
} else {
    console.log('Fix 1 skipped: wrapper already modified or not found');
}

// Fix 2: Close the overflow-x-auto div before mobile card view
const mobileMarker = '{/* Mobile Card View */}';
if (c.includes(mobileMarker) && !c.includes('</div>' + mobileMarker)) {
    c = c.replace(mobileMarker, '</div>' + mobileMarker);
    console.log('Fix 2 applied: overflow div closed before mobile view');
} else {
    console.log('Fix 2 skipped');
}

// Fix 3: Make entire row clickable for editing
const oldRow = 'className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(product.id) ? \'bg-indigo-50\' : \'\'}`}';
const newRow = 'onClick={() => handleEdit(product)} className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.includes(product.id) ? \'bg-indigo-50\' : \'\'}`}';

if (c.includes(oldRow)) {
    c = c.replace(oldRow, newRow);
    console.log('Fix 3 applied: row click-to-edit added');
} else {
    // Try alternate
    const alt = "className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(product.id)";
    const idx = c.indexOf(alt);
    if (idx !== -1) {
        // Insert onClick before className
        c = c.slice(0, idx) + 'onClick={() => handleEdit(product)} ' + c.slice(idx);
        // Also add cursor-pointer
        c = c.replace('hover:bg-gray-50 transition-colors ${selectedIds', 'hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds');
        console.log('Fix 3 applied via alternate method');
    } else {
        console.log('Fix 3 skipped: row pattern not found');
    }
}

fs.writeFileSync(path, c, 'utf8');
console.log('All done!');
