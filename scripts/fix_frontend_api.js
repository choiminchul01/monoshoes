const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/\r\n/g, '\n');

const oldCode = `            // 신규 상품 등록
            if (newProducts.length > 0) {
                const productsToInsert = newProducts.map(item => ({
                    name: String(item.name || ''),
                    brand: String(item.brand || '').toUpperCase(),
                    price: Number(item.price) || 0,
                    category: CATEGORIES.includes(String(item.category || '').toUpperCase()) ? String(item.category || '').toUpperCase() : "W_FLAT",
                    stock: Number(item.stock) || 0,
                    is_available: (Number(item.stock) || 0) > 0,
                    description: String(item.description || ''),
                    is_best: Boolean(item.is_best),
                    is_new: Boolean(item.is_new),
                    is_celeb_pick: Boolean(item.is_celeb_pick),
                    discount_percent: Number(item.discount_percent) || 0,
                    images: item.images || [],
                    detail_images: item.detailImages || [],
                    details: {
                        colors: item.colors ? String(item.colors).split(",").map(c => ({ name: c.trim(), value: c.trim() })) : [],
                        sizes: item.sizes ? String(item.sizes).split(",").map(s => s.trim()) : [],
                        features: item.features ? String(item.features).split(",").map(f => f.trim()) : [],
                    }
                }));

                const { error: insertError } = await supabase
                    .from("products")
                    .insert(productsToInsert);

                if (insertError) throw insertError;
                insertedCount = newProducts.length;
            }

            // 중복 상품 처리
            if (duplicateProducts.length > 0) {
                if (duplicateAction === 'update') {
                    // 중복 상품 업데이트
                    for (const item of duplicateProducts) {
                        if (item.existingProductId) {
                            const { error: updateError } = await supabase
                                .from("products")
                                .update({
                                    price: Number(item.price) || 0,
                                    stock: Number(item.stock) || 0,
                                    is_available: (Number(item.stock) || 0) > 0,
                                    description: String(item.description || ''),
                                    is_best: Boolean(item.is_best),
                                    is_new: Boolean(item.is_new),
                                    is_celeb_pick: Boolean(item.is_celeb_pick),
                                    discount_percent: Number(item.discount_percent) || 0,
                                    images: item.images || [],
                                    detail_images: item.detailImages || [],
                                    details: {
                                        colors: item.colors ? String(item.colors).split(",").map(c => ({ name: c.trim(), value: c.trim() })) : [],
                                        sizes: item.sizes ? String(item.sizes).split(",").map(s => s.trim()) : [],
                                        features: item.features ? String(item.features).split(",").map(f => f.trim()) : [],
                                    }
                                })
                                .eq('id', item.existingProductId);

                            if (updateError) {
                                console.error("Update error:", updateError);
                            } else {
                                updatedCount++;
                            }
                        }
                    }
                } else {
                    // 중복 상품 스킵
                    skippedCount = duplicateProducts.length;
                }
            }`;

const newCode = `            // API를 통한 백엔드(서버 권한) 우회 처리 (RLS 정책 충돌 방지)
            const productsToInsert = newProducts.map(item => ({
                name: String(item.name || ''),
                brand: String(item.brand || '').toUpperCase(),
                price: Number(item.price) || 0,
                category: CATEGORIES.includes(String(item.category || '').toUpperCase()) ? String(item.category || '').toUpperCase() : "W_FLAT",
                stock: Number(item.stock) || 0,
                is_available: (Number(item.stock) || 0) > 0,
                description: String(item.description || ''),
                is_best: Boolean(item.is_best),
                is_new: Boolean(item.is_new),
                is_celeb_pick: Boolean(item.is_celeb_pick),
                discount_percent: Number(item.discount_percent) || 0,
                images: item.images || [],
                detail_images: item.detailImages || [],
                details: {
                    colors: item.colors ? String(item.colors).split(",").map(c => ({ name: c.trim(), value: c.trim() })) : [],
                    sizes: item.sizes ? String(item.sizes).split(",").map(s => s.trim()) : [],
                    features: item.features ? String(item.features).split(",").map(f => f.trim()) : [],
                }
            }));

            const duplicatePayload = duplicateProducts.map(item => ({
                existingProductId: item.existingProductId,
                updateData: {
                    price: Number(item.price) || 0,
                    stock: Number(item.stock) || 0,
                    is_available: (Number(item.stock) || 0) > 0,
                    description: String(item.description || ''),
                    is_best: Boolean(item.is_best),
                    is_new: Boolean(item.is_new),
                    is_celeb_pick: Boolean(item.is_celeb_pick),
                    discount_percent: Number(item.discount_percent) || 0,
                    images: item.images || [],
                    detail_images: item.detailImages || [],
                    details: {
                        colors: item.colors ? String(item.colors).split(",").map(c => ({ name: c.trim(), value: c.trim() })) : [],
                        sizes: item.sizes ? String(item.sizes).split(",").map(s => s.trim()) : [],
                        features: item.features ? String(item.features).split(",").map(f => f.trim()) : [],
                    }
                }
            }));

            const response = await fetch('/api/admin/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productsToInsert,
                    duplicateProducts: duplicatePayload,
                    duplicateAction
                })
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || "API 서버 응답 오류");
            }

            let insertedCount = result.insertedCount || 0;
            let updatedCount = result.updatedCount || 0;
            let skippedCount = result.skippedCount || 0;
            
            if (duplicateProducts.length > 0 && duplicateAction !== 'update') {
                skippedCount = duplicateProducts.length;
            }`;

if (c.includes(oldCode)) {
    c = c.replace(oldCode, newCode);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Successfully patched executeBulkUpload to use API route.');
} else {
    console.log('Failed to patch executeBulkUpload. The code might have changed.');
    // Try to locate just the first part to see if it exists
    if(c.includes('const productsToInsert = newProducts.map')) console.log('Partial match found, regex needs tuning.');
}
