const fs = require('fs');
const path = "c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/shop/[id]/page.tsx";
const content = fs.readFileSync(path, 'utf8');

// Find the option section start and end
const startMarker = '{/* 옵션 선택 영역 — 신발 전용 */}';
const endMarker = '{/* 수량 선택 */}';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found!', {startIdx, endIdx});
    process.exit(1);
}

console.log('Found section from', startIdx, 'to', endIdx);

const newSection = `{/* 옵션 선택 영역 — 신발 전용 */}
                        <div className="space-y-6">

                            {/* 색상 선택 */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-black tracking-[0.25em] text-gray-400 uppercase">
                                        COLOR
                                        {selectedColor && (
                                            <span className="ml-2 text-black normal-case font-semibold tracking-normal text-sm">
                                                {selectedColor.name}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {product.details?.colors && product.details.colors.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {product.details.colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => setSelectedColor(color)}
                                                className={\`relative px-5 py-2.5 text-[13px] font-medium tracking-wide transition-all duration-200 border
                                                    \${selectedColor?.name === color.name
                                                        ? 'bg-black border-black text-white'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:border-black hover:text-black'
                                                    }\`}
                                            >
                                                {color.name.split('#')[0].trim()}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {['블랙', '베이지', '아이보리', '네이비'].map((colorName) => (
                                            <button
                                                key={colorName}
                                                onClick={() => setSelectedColor({ name: colorName, value: colorName })}
                                                className={\`px-5 py-2.5 text-[13px] font-medium tracking-wide transition-all duration-200 border
                                                    \${selectedColor?.name === colorName
                                                        ? 'bg-black border-black text-white'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:border-black hover:text-black'
                                                    }\`}
                                            >
                                                {colorName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 사이즈 선택 — 신발 전용 */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-black tracking-[0.25em] text-gray-400 uppercase">
                                        SIZE
                                        {selectedSize && (
                                            <span className="ml-2 text-black normal-case font-semibold tracking-normal text-sm">
                                                {selectedSize}mm
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('size-guide-tab');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-black transition-colors tracking-wide"
                                    >
                                        SIZE GUIDE
                                    </button>
                                </div>

                                {product.details?.sizes && product.details.sizes.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {product.details.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={\`w-[72px] h-11 text-[13px] font-semibold tracking-wide transition-all duration-200 border
                                                    \${selectedSize === size
                                                        ? 'bg-black border-black text-white'
                                                        : 'bg-white border-gray-300 text-gray-600 hover:border-black hover:text-black'
                                                    }\`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {['220', '225', '230', '235', '240', '245', '250', '255', '260'].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={\`w-[72px] h-11 text-[13px] font-semibold tracking-wide transition-all duration-200 border
                                                    \${selectedSize === size
                                                        ? 'bg-black border-black text-white'
                                                        : 'bg-white border-gray-300 text-gray-600 hover:border-black hover:text-black'
                                                    }\`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!selectedSize && (
                                    <p className="mt-2 text-[11px] text-amber-600 font-medium tracking-wide">
                                        ※ 사이즈를 선택해주세요
                                    </p>
                                )}
                            </div>

                            `;

const newContent = content.slice(0, startIdx) + newSection + content.slice(endIdx);
fs.writeFileSync(path, newContent, 'utf8');
console.log('Success! Product detail option buttons updated.');
