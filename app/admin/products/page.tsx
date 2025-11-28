"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, Edit, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/Pagination";

type Product = {
    id: string;
    name: string;
    brand: string;
    price: number;
    category: string;
    images: string[];
    description: string;
    stock: number;
    is_available: boolean;
    details?: {
        colors?: { name: string; value: string }[];
        sizes?: string[];
        features?: string[];
    };
    created_at: string;
};

type ProductFormData = Omit<Product, "id" | "created_at" | "images"> & {
    images: File[];
    existingImages?: string[];
    colors: { name: string; value: string }[];
    sizes: string[];
    features: string[];
};

const CATEGORIES = ["BAG", "WALLET", "SHOES", "CLOTHING", "ACCESSORY"];

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        brand: "",
        price: 0,
        category: "BAG",
        images: [],
        description: "",
        stock: 0,
        is_available: true,
        existingImages: [],
        colors: [],
        sizes: [],
        features: []
    });
    const [uploading, setUploading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isContinue, setIsContinue] = useState(false);

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 10;

    // 중복 제거된 브랜드 목록 생성 및 정렬
    const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).sort();

    // 입력된 값에 따라 필터링된 브랜드 목록
    const filteredBrands = uniqueBrands.filter(brand =>
        brand.toLowerCase().startsWith((formData.brand || "").toLowerCase())
    );

    // 검색 및 페이지네이션 로직
    const getFilteredProducts = () => {
        let result = products;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerTerm) ||
                p.brand.toLowerCase().includes(lowerTerm) ||
                p.category.toLowerCase().includes(lowerTerm)
            );
        }

        return result;
    };

    const filteredProducts = getFilteredProducts();
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            fetchProducts();
        }
    }, [isMounted]);

    // 디버깅: 이미지 URL 확인
    useEffect(() => {
        if (products.length > 0) {
            console.log('Admin - First product images:', products[0].images);
        }
    }, [products]);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setProducts(data as Product[]);
        }
        setLoading(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // 파일 크기 및 형식 검증
            const maxSize = 5 * 1024 * 1024; // 5MB
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

            const invalidFiles = files.filter(file =>
                !validTypes.includes(file.type) || file.size > maxSize
            );

            if (invalidFiles.length > 0) {
                const sizeErrors = invalidFiles.filter(f => f.size > maxSize);
                const typeErrors = invalidFiles.filter(f => !validTypes.includes(f.type));

                let errorMsg = '';
                if (sizeErrors.length > 0) {
                    errorMsg += `파일 크기가 5MB를 초과하는 파일: ${sizeErrors.map(f => f.name).join(', ')}\n`;
                }
                if (typeErrors.length > 0) {
                    errorMsg += `지원하지 않는 파일 형식: ${typeErrors.map(f => f.name).join(', ')}\n`;
                }

                alert(errorMsg + '\n지원 형식: JPG, PNG, WebP (최대 5MB)');
                return;
            }

            setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const removeExistingImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            existingImages: prev.existingImages?.filter((_, i) => i !== index)
        }));
    };

    const uploadImages = async (files: File[]): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        for (const file of files) {
            // 파일 이름을 안전하게 변환 (공백, 한글, 특수문자 제거)
            const safeFileName = file.name
                .replace(/[^a-zA-Z0-9.-]/g, '-') // 영문, 숫자, 점, 하이픈만 허용
                .replace(/--+/g, '-') // 연속된 하이픈을 하나로
                .toLowerCase(); // 소문자로 변환

            const fileName = `${Date.now()}-${safeFileName}`;
            const { data, error } = await supabase.storage
                .from("product-images")
                .upload(fileName, file);

            if (!error && data) {
                const { data: { publicUrl } } = supabase.storage
                    .from("product-images")
                    .getPublicUrl(data.path);
                uploadedUrls.push(publicUrl);
            } else {
                console.error("Image upload failed:", error);
            }
        }

        return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            // 이미지 업로드
            let imageUrls: string[] = formData.existingImages || [];
            if (formData.images.length > 0) {
                const newUrls = await uploadImages(formData.images);
                imageUrls = [...imageUrls, ...newUrls];
            }

            const productData = {
                name: formData.name,
                brand: formData.brand,
                price: formData.price,
                category: formData.category,
                images: imageUrls,
                description: formData.description,
                stock: formData.stock,
                is_available: formData.is_available,
                details: {
                    colors: formData.colors,
                    sizes: formData.sizes,
                    features: formData.features
                }
            };

            if (editingProduct) {
                // 수정
                const { error } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", editingProduct.id);

                if (error) throw error;
                alert("상품이 수정되었습니다");
            } else {
                // 추가
                const { error } = await supabase
                    .from("products")
                    .insert([productData]);

                if (error) throw error;

                if (isContinue) {
                    alert("상품이 추가되었습니다. 다음 상품을 입력해주세요.");
                    resetForm();
                    // 모달 유지
                } else {
                    alert("상품이 추가되었습니다");
                    setShowModal(false);
                    resetForm();
                }
            }

            fetchProducts();
        } catch (error) {
            console.error("Error:", error);
            alert("오류가 발생했습니다");
        } finally {
            setUploading(false);
            setIsContinue(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            brand: product.brand,
            price: product.price,
            category: product.category,
            images: [],
            existingImages: product.images,
            description: product.description,
            stock: product.stock,
            is_available: product.is_available,
            colors: product.details?.colors || [],
            sizes: product.details?.sizes || [],
            features: product.details?.features || []
        });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        setDeleteTargetId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", deleteTargetId);

        if (!error) {
            alert("상품이 삭제되었습니다");
            fetchProducts();
        } else {
            console.error("Delete error:", error);
            alert(`삭제 실패: ${error.message}`);
        }
        setShowDeleteConfirm(false);
        setDeleteTargetId(null);
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            name: "",
            brand: "",
            price: 0,
            category: "BAG",
            images: [],
            existingImages: [],
            description: "",
            stock: 0,
            is_available: true,
            colors: [],
            sizes: [],
            features: []
        });
    };

    if (!isMounted) return null;

    const lowStockCount = products.filter(product => product.stock < 5).length;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">상품 관리</h1>
                    {lowStockCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border-2 border-orange-200 rounded-full">
                            <span className="text-sm font-bold text-orange-700">
                                재고부족 {lowStockCount}건
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <AdminSearch
                        value={searchTerm}
                        onChange={(val) => {
                            setSearchTerm(val);
                            setCurrentPage(1); // 검색 시 1페이지로 리셋
                        }}
                        placeholder="상품명, 브랜드, 카테고리 검색..."
                    />
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        상품 추가
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                {/* Desktop Table View */}
                <table className="w-full hidden md:table">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이미지</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">브랜드</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">재고</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center">로딩 중...</td>
                            </tr>
                        ) : currentProducts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center">검색 결과가 없습니다.</td>
                            </tr>
                        ) : (
                            currentProducts.map((product) => (
                                <tr
                                    key={product.id}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => handleEdit(product)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="relative w-16 h-16">
                                            {product.images && product.images[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="absolute inset-0 w-full h-full rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                    No Img
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{product.brand}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₩{product.price.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{product.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {product.is_available ? '판매중' : '품절'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">로딩 중...</div>
                    ) : currentProducts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">검색 결과가 없습니다.</div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {currentProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="p-4 flex gap-4 active:bg-gray-50"
                                    onClick={() => handleEdit(product)}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                        {product.images && product.images[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                No Img
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-base font-bold text-gray-900 truncate pr-2">{product.name}</h3>
                                                <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {product.is_available ? '판매중' : '품절'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-0.5">{product.brand} | {product.category}</p>
                                        </div>

                                        <div className="flex justify-between items-end mt-2">
                                            <div>
                                                <p className="text-lg font-bold text-gray-900">₩{product.price.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">재고: {product.stock}개</p>
                                            </div>
                                            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">
                                {editingProduct ? "상품 수정" : "상품 추가"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {/* 이미지 업로드 섹션 */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">상품 이미지</label>
                                <p className="text-xs text-gray-500 mb-2">※ 첫 번째 이미지가 대표 이미지(썸네일)로 사용됩니다.</p>

                                {/* 업로드 버튼 */}
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Upload className="w-4 h-4" />
                                        <span>이미지 선택</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <span className="text-sm text-gray-500">
                                        {formData.images.length + (formData.existingImages?.length || 0)}개 이미지
                                    </span>
                                </div>

                                {/* 이미지 미리보기 그리드 */}
                                <div className="grid grid-cols-5 gap-4">
                                    {/* 기존 이미지 표시 */}
                                    {formData.existingImages?.map((url, index) => (
                                        <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                            <Image src={url} alt={`Existing ${index}`} fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* 새 이미지 표시 */}
                                    {formData.images.map((file, index) => (
                                        <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                            <Image src={URL.createObjectURL(file)} alt={`New ${index}`} fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">상품명</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            {/* 브랜드 */}
                            <div>
                                <label className="block text-sm font-medium mb-2">브랜드</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={formData.brand || ""}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, brand: e.target.value }));
                                            setShowBrandSuggestions(true);
                                        }}
                                        onFocus={() => setShowBrandSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="브랜드를 입력하거나 선택하세요"
                                        autoComplete="off"
                                    />
                                    {showBrandSuggestions && (formData.brand || filteredBrands.length > 0) && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredBrands.length > 0 ? (
                                                filteredBrands.map((brand, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, brand: brand }));
                                                            setShowBrandSuggestions(false);
                                                        }}
                                                    >
                                                        {brand}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-sm text-gray-500">
                                                    새로운 브랜드입니다
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 가격 */}
                            <div>
                                <label className="block text-sm font-medium mb-2">가격 (원)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                {formData.price > 0 && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {formData.price.toLocaleString()}원
                                    </p>
                                )}
                            </div>

                            {/* 카테고리 */}
                            <div>
                                <label className="block text-sm font-medium mb-2">카테고리</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 설명 */}
                            <div>
                                <label className="block text-sm font-medium mb-2">상품 설명</label>
                                <textarea
                                    rows={4}
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            {/* 재고 */}
                            <div>
                                <label className="block text-sm font-medium mb-2">재고</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.stock || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                {formData.stock === 0 && (
                                    <p className="text-sm text-orange-600 mt-1">⚠️ 재고가 0이면 자동 품절 처리됩니다</p>
                                )}
                            </div>

                            {/* 품절 토글 */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_available"
                                    checked={formData.is_available}
                                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">
                                    판매 가능
                                </label>
                            </div>

                            {/* Colors */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">색상 옵션</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="색상명 (예: 블랙, 화이트, Red)"
                                        id="colorNameInput"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = e.currentTarget;
                                                if (input.value) {
                                                    setFormData({
                                                        ...formData,
                                                        colors: [...formData.colors, { name: input.value, value: input.value }]
                                                    });
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nameInput = document.getElementById('colorNameInput') as HTMLInputElement;
                                            if (nameInput.value) {
                                                setFormData({
                                                    ...formData,
                                                    colors: [...formData.colors, { name: nameInput.value, value: nameInput.value }]
                                                });
                                                nameInput.value = '';
                                            }
                                        }}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        추가
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.colors.map((color, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border">
                                            <span className="text-sm">{color.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newColors = [...formData.colors];
                                                    newColors.splice(index, 1);
                                                    setFormData({ ...formData, colors: newColors });
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sizes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">사이즈 옵션</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="사이즈 (예: S, M, L, 240)"
                                        id="sizeInput"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = e.currentTarget;
                                                if (input.value) {
                                                    setFormData({
                                                        ...formData,
                                                        sizes: [...formData.sizes, input.value]
                                                    });
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('sizeInput') as HTMLInputElement;
                                            if (input.value) {
                                                setFormData({
                                                    ...formData,
                                                    sizes: [...formData.sizes, input.value]
                                                });
                                                input.value = '';
                                            }
                                        }}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        추가
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.sizes.map((size, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border">
                                            <span className="text-sm">{size}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSizes = [...formData.sizes];
                                                    newSizes.splice(index, 1);
                                                    setFormData({ ...formData, sizes: newSizes });
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">상세 특징 (Details)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="특징 입력 (예: 천연 가죽)"
                                        id="featureInput"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = e.currentTarget;
                                                if (input.value) {
                                                    setFormData({
                                                        ...formData,
                                                        features: [...formData.features, input.value]
                                                    });
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('featureInput') as HTMLInputElement;
                                            if (input.value) {
                                                setFormData({
                                                    ...formData,
                                                    features: [...formData.features, input.value]
                                                });
                                                input.value = '';
                                            }
                                        }}
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        추가
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border">
                                            <span className="text-sm">{feature}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFeatures = [...formData.features];
                                                    newFeatures.splice(index, 1);
                                                    setFormData({ ...formData, features: newFeatures });
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {uploading ? "저장 중..." : (editingProduct ? "수정 완료" : "상품 추가")}
                                </button>
                                {!editingProduct && (
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        onClick={() => setIsContinue(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {uploading ? "저장 중..." : "저장 후 계속 추가"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">상품 삭제</h3>
                        <p className="text-gray-600 mb-6">정말 이 상품을 삭제하시겠습니까?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteTargetId(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
