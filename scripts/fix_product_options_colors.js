const fs = require('fs');
const path = "c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/shop/[id]/page.tsx";
let content = fs.readFileSync(path, 'utf8');

// Replace active state for buttons
content = content.replace(/bg-black border-black text-white/g, "bg-[#4a5544] border-[#4a5544] text-white");

// Replace hover state for color buttons
content = content.replace(/hover:border-black hover:text-black/g, "hover:border-[#4a5544] hover:text-[#4a5544]");

// Replace indicator dot
content = content.replace(/w-2 h-2 bg-black rounded-full/g, "w-2 h-2 bg-[#4a5544] rounded-full");

// Also check hover:text-black for SIZE GUIDE text to hover:text-[#4a5544]
content = content.replace(/hover:text-black transition-colors tracking-wide/g, "hover:text-[#4a5544] transition-colors tracking-wide");

fs.writeFileSync(path, content, 'utf8');
console.log('Success! Option button colors updated to match Buy Now button.');
