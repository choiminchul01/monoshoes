const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/admin/products/page.tsx';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/\r\n/g, '\n');

const oldMap = `                const productsToInsert = newProducts.map(item => ({
                    name: item.name,
                    brand: item.brand.toUpperCase(),
                    price: item.price,
                    category: CATEGORIES.includes(item.category.toUpperCase()) ? item.category.toUpperCase() : "W_FLAT",
                    stock: item.stock,
                    is_available: item.stock > 0,
                    description: item.description,
                    is_best: item.is_best || false,
                    is_new: item.is_new || false,
                    is_celeb_pick: item.is_celeb_pick || false,
                    discount_percent: item.discount_percent || 0,
                    images: item.images || [],
                    detail_images: item.detailImages || [],
                    details: {
                        colors: item.colors ? item.colors.split(",").map(c => ({ name: c.trim(), value: c.trim() })) : [],
                        sizes: item.sizes ? item.sizes.split(",").map(s => s.trim()) : [],
                        features: item.features ? item.features.split(",").map(f => f.trim()) : [],
                    }
                }));`;

const newMap = `                const productsToInsert = newProducts.map(item => ({
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
                }));`;

const oldUpMap = `                                .update({
                                    price: item.price,
                                    stock: item.stock,
                                    is_available: item.stock > 0,
                                    description: item.description,
                                    is_best: item.is_best || false,
                                    is_new: item.is_new || false,
                                    is_celeb_pick: item.is_celeb_pick || false,
                                    discount_percent: item.discount_percent || 0,
                                    images: item.images || [],
                                    detail_images: item.detailImages || [],
                                    details: {
                                        colors: item.colors ? item.colors.split(",").map(c => ({ name: c.trim(), value: c.trim() })) : [],
                                        sizes: item.sizes ? item.sizes.split(",").map(s => s.trim()) : [],
                                        features: item.features ? item.features.split(",").map(f => f.trim()) : [],
                                    }
                                })`;

const newUpMap = `                                .update({
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
                                })`;

const oldCatch = `        } catch (error: any) {
            console.error("Bulk upload error:", error);
            toast.error(\`일괄 등록 실패: \${error.message}\`);`;

const newCatch = `        } catch (error: any) {
            console.error("Bulk upload error object:", error);
            const errorMessage = error?.message || error?.details || JSON.stringify(error) || "알 수 없는 에러";
            toast.error(\`일괄 등록 실패: \${errorMessage}\`);`;

if (c.includes(oldMap)) c = c.replace(oldMap, newMap);
if (c.includes(oldUpMap)) c = c.replace(oldUpMap, newUpMap);
if (c.includes(oldCatch)) c = c.replace(oldCatch, newCatch);

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed bulk crash type errors.');
