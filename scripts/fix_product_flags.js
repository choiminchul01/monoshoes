const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
const content = fs.readFileSync(path, 'utf8');

const startMarker = '{/* 업로드 버튼 + 베스트/신상 체크박스 */}';
const endMarker = '{/* 이미지 미리보기 그리드 */}';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found!');
    process.exit(1);
}

const indent = '                                    ';
const newSection = `{/* 업로드 버튼 */}
${indent}<div className="flex items-center gap-4 mb-4">
${indent}    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
${indent}        <Upload className="w-4 h-4" />
${indent}        <span>이미지 선택</span>
${indent}        <input
${indent}            type="file"
${indent}            multiple
${indent}            accept="image/*"
${indent}            onChange={handleImageChange}
${indent}            className="hidden"
${indent}        />
${indent}    </label>
${indent}    <span className="text-sm text-gray-500">
${indent}        {formData.images.length + (formData.existingImages?.length || 0)}개 이미지
${indent}    </span>
${indent}</div>

${indent}{/* 노출 카테고리 배지 토글 */}
${indent}<div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
${indent}    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
${indent}        노출 카테고리 배지
${indent}        <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal text-[11px]">복수 선택 가능 · 클릭하여 토글</span>
${indent}    </label>
${indent}    <div className="flex flex-wrap gap-2">
${indent}        <button
${indent}            type="button"
${indent}            onClick={() => setFormData(prev => ({ ...prev, is_best: !prev.is_best }))}
${indent}            className={\`px-4 py-2 rounded-full border-2 text-sm font-bold tracking-wide transition-all duration-150 select-none \${
${indent}                formData.is_best
${indent}                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm scale-105'
${indent}                    : 'bg-white border-gray-200 text-gray-400 hover:border-amber-400 hover:text-amber-600'
${indent}            }\`}
${indent}        >
${indent}            {formData.is_best ? '✓ ' : ''}베스트
${indent}        </button>
${indent}        <button
${indent}            type="button"
${indent}            onClick={() => setFormData(prev => ({ ...prev, is_new: !prev.is_new }))}
${indent}            className={\`px-4 py-2 rounded-full border-2 text-sm font-bold tracking-wide transition-all duration-150 select-none \${
${indent}                formData.is_new
${indent}                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105'
${indent}                    : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600'
${indent}            }\`}
${indent}        >
${indent}            {formData.is_new ? '✓ ' : ''}신상품
${indent}        </button>
${indent}        <button
${indent}            type="button"
${indent}            onClick={() => setFormData(prev => ({ ...prev, is_celeb_pick: !prev.is_celeb_pick }))}
${indent}            className={\`px-4 py-2 rounded-full border-2 text-sm font-bold tracking-wide transition-all duration-150 select-none \${
${indent}                formData.is_celeb_pick
${indent}                    ? 'bg-violet-500 border-violet-500 text-white shadow-sm scale-105'
${indent}                    : 'bg-white border-gray-200 text-gray-400 hover:border-violet-400 hover:text-violet-600'
${indent}            }\`}
${indent}        >
${indent}            {formData.is_celeb_pick ? '✓ ' : ''}SHOP 추천
${indent}        </button>
${indent}        <div
${indent}            className={\`px-4 py-2 rounded-full border-2 text-sm font-bold tracking-wide select-none flex items-center gap-1 cursor-default \${
${indent}                (formData.discount_percent ?? 0) > 0
${indent}                    ? 'bg-red-500 border-red-500 text-white shadow-sm scale-105'
${indent}                    : 'bg-white border-gray-200 text-gray-300'
${indent}            }\`}
${indent}            title="아래 할인율 입력 시 자동 활성화"
${indent}        >
${indent}            {(formData.discount_percent ?? 0) > 0 ? \`✓ 특가 -\${formData.discount_percent}%\` : '특가 (자동)'}
${indent}        </div>
${indent}    </div>
${indent}    <p className="text-[11px] text-gray-400 mt-2">※ 특가 배지는 아래 할인율 입력 시 자동으로 표시됩니다.</p>
${indent}</div>

${indent}{formData.is_celeb_pick && (formData.existingImages?.length || 0) + formData.images.length > 1 && (
${indent}    <div className="mb-4">
${indent}        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">SHOP 추천 대표 이미지</label>
${indent}        <select
${indent}            value={formData.celeb_pick_image_index || 0}
${indent}            onChange={(e) => setFormData(prev => ({ ...prev, celeb_pick_image_index: parseInt(e.target.value) }))}
${indent}            className="px-3 py-1.5 text-sm border border-violet-300 rounded-lg bg-violet-50 text-violet-700"
${indent}        >
${indent}            {[...(formData.existingImages || []), ...formData.images.map((f, i) => \`새이미지\${i + 1}\`)].map((_, idx) => (
${indent}                <option key={idx} value={idx}>{idx + 1}번 이미지</option>
${indent}            ))}
${indent}        </select>
${indent}    </div>
${indent})}

${indent}`;

const newContent = content.slice(0, startIdx) + newSection + content.slice(endIdx);
fs.writeFileSync(path, newContent, 'utf8');
console.log('Success! Product flag UI replaced.');
