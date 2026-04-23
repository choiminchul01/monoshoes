"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, Edit, Plus, Upload, X, RefreshCw, Download, FileSpreadsheet } from "lucide-react";
import Image from "next/image";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import * as XLSX from "xlsx";
import { fetchBrandAliasesAction, saveBrandAliasesAction, type BrandAliases } from "@/lib/brandAliases";

type Product = {
    id: string;
    name: string;
    brand: string;
    price: number;
    category: string;
    images: string[];
    detail_images?: string[];
    description: string;
    stock: number;
    is_available: boolean;
    is_best?: boolean;
    is_new?: boolean;
    is_celeb_pick?: boolean;
    celeb_pick_image_index?: number;
    discount_percent?: number;
    details?: {
        colors?: { name: string; value: string }[];
        sizes?: string[];
        features?: string[];
    };
    created_at: string;
};

type ProductFormData = Omit<Product, "id" | "created_at" | "images" | "detail_images"> & {
    images: File[];
    existingImages?: string[];
    detailImages: File[];
    existingDetailImages?: string[];
    colors: { name: string; value: string }[];
    sizes: string[];
    features: string[];
};

type BulkProductData = {
    name: string;
    brand: string;
    price: number;
    category: string;
    stock: number;
    colors: string;
    sizes: string;
    features: string;
    description: string;
    images: string[]; // 메인 이미지 URL (이미지1-2, 최대 2개)
    detailImages: string[]; // 상세페이지 이미지 URL (이미지3-10, 최대 8개)
    // 중복 체크 관련
    isDuplicate?: boolean;
    existingProductId?: string;
};

const CATEGORIES = ["BAG", "WALLET", "SHOES", "ACCESSORY"];

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
        detailImages: [],
        description: "",
        stock: 0,
        is_available: true,
        is_best: false,
        is_new: false,
        is_celeb_pick: false,
        celeb_pick_image_index: 0,
        discount_percent: 0,
        existingImages: [],
        existingDetailImages: [],
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

    // 브랜드 별칭 (한글명) 관련 state
    const [brandAliases, setBrandAliases] = useState<BrandAliases>({});
    const [brandKoreanName, setBrandKoreanName] = useState('');

    // Bulk delete state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    // Bulk upload state
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [bulkUploadData, setBulkUploadData] = useState<BulkProductData[]>([]);
    const [bulkUploading, setBulkUploading] = useState(false);
    // 중복 체크 관련 state
    const [duplicateAction, setDuplicateAction] = useState<'ask' | 'skip' | 'update'>('ask');
    const [duplicateCount, setDuplicateCount] = useState(0);

    // Drag and drop state for image reordering
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
    const [draggedImageType, setDraggedImageType] = useState<'existing' | 'new' | null>(null);

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 10;

    // 중복 제거된 브랜드 목록 생성 및 정렬
    const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).sort();

    // 이미지 프리뷰 URL 캐시 (깜빡임 방지)
    const imagePreviewUrls = useMemo(() => {
        return formData.images.map(file => URL.createObjectURL(file));
    }, [formData.images]);

    const detailImagePreviewUrls = useMemo(() => {
        return formData.detailImages.map(file => URL.createObjectURL(file));
    }, [formData.detailImages]);

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
            fetchBrandAliases();
        }
    }, [isMounted]);

    const fetchBrandAliases = async () => {
        const result = await fetchBrandAliasesAction();
        if (result.success && result.aliases) {
            setBrandAliases(result.aliases);
        }
    };
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
            const maxSize = 10 * 1024 * 1024; // 10MB
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

            const invalidFiles = files.filter(file =>
                !validTypes.includes(file.type) || file.size > maxSize
            );

            if (invalidFiles.length > 0) {
                const sizeErrors = invalidFiles.filter(f => f.size > maxSize);
                const typeErrors = invalidFiles.filter(f => !validTypes.includes(f.type));

                let errorMsg = '';
                if (sizeErrors.length > 0) {
                    errorMsg += `파일 크기가 10MB를 초과하는 파일: ${sizeErrors.map(f => f.name).join(', ')}\n`;
                }
                if (typeErrors.length > 0) {
                    errorMsg += `지원하지 않는 파일 형식: ${typeErrors.map(f => f.name).join(', ')}\n`;
                }

                alert(errorMsg + '\n지원 형식: JPG, PNG, WebP (최대 10MB)');
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

    // 상세 이미지 핸들러들
    const handleDetailImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // 파일 크기 및 형식 검증
            const maxSize = 20 * 1024 * 1024; // 20MB
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

            const invalidFiles = files.filter(file =>
                !validTypes.includes(file.type) || file.size > maxSize
            );

            if (invalidFiles.length > 0) {
                const sizeErrors = invalidFiles.filter(f => f.size > maxSize);
                const typeErrors = invalidFiles.filter(f => !validTypes.includes(f.type));

                let errorMsg = '';
                if (sizeErrors.length > 0) {
                    errorMsg += `파일 크기가 20MB를 초과하는 파일: ${sizeErrors.map(f => f.name).join(', ')}\n`;
                }
                if (typeErrors.length > 0) {
                    errorMsg += `지원하지 않는 파일 형식: ${typeErrors.map(f => f.name).join(', ')}\n`;
                }

                alert(errorMsg + '\n지원 형식: JPG, PNG, WebP (최대 20MB)');
                return;
            }

            setFormData(prev => ({ ...prev, detailImages: [...prev.detailImages, ...files] }));
        }
    };

    const removeDetailImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            detailImages: prev.detailImages.filter((_, i) => i !== index)
        }));
    };

    const removeExistingDetailImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            existingDetailImages: prev.existingDetailImages?.filter((_, i) => i !== index)
        }));
    };

    // 드래그 앤 드롭으로 이미지 순서 변경
    const moveImage = (fromIndex: number, toIndex: number, fromType: 'existing' | 'new', toType: 'existing' | 'new') => {
        // 같은 타입 내에서만 순서 변경 (existing끼리, new끼리)
        if (fromType === 'existing' && toType === 'existing') {
            const existingImages = [...(formData.existingImages || [])];
            const [movedItem] = existingImages.splice(fromIndex, 1);
            existingImages.splice(toIndex, 0, movedItem);
            setFormData(prev => ({
                ...prev,
                existingImages
            }));
        } else if (fromType === 'new' && toType === 'new') {
            const newImages = [...formData.images];
            const [movedItem] = newImages.splice(fromIndex, 1);
            newImages.splice(toIndex, 0, movedItem);
            setFormData(prev => ({
                ...prev,
                images: newImages
            }));
        }
        // 다른 타입 간 이동은 지원하지 않음 (복잡도 높음)
    };

    const handleImageDragStart = (e: React.DragEvent, index: number, type: 'existing' | 'new') => {
        setDraggedImageIndex(index);
        setDraggedImageType(type);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleImageDragOver = (e: React.DragEvent, index: number, type: 'existing' | 'new') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const actualIndex = type === 'existing' ? index : (formData.existingImages?.length || 0) + index;
        setDragOverImageIndex(actualIndex);
    };

    const handleImageDrop = (e: React.DragEvent, toIndex: number, toType: 'existing' | 'new') => {
        e.preventDefault();
        if (draggedImageIndex !== null && draggedImageType !== null) {
            moveImage(draggedImageIndex, toIndex, draggedImageType, toType);
        }
        setDraggedImageIndex(null);
        setDragOverImageIndex(null);
        setDraggedImageType(null);
    };

    const handleImageDragEnd = () => {
        setDraggedImageIndex(null);
        setDragOverImageIndex(null);
        setDraggedImageType(null);
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

    const toast = useToast();
    // ... (existing state)

    // ... (existing useEffects and helper functions)

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (handleSubmit logic as implemented in previous step)
        e.preventDefault();
        setUploading(true);

        try {
            // 상품 이미지 업로드
            let imageUrls: string[] = formData.existingImages || [];
            if (formData.images.length > 0) {
                const newUrls = await uploadImages(formData.images);
                imageUrls = [...imageUrls, ...newUrls];
            }

            // 상세 페이지 이미지 업로드
            let detailImageUrls: string[] = formData.existingDetailImages || [];
            if (formData.detailImages.length > 0) {
                const newDetailUrls = await uploadImages(formData.detailImages);
                detailImageUrls = [...detailImageUrls, ...newDetailUrls];
            }

            const productData = {
                name: formData.name,
                brand: formData.brand,
                price: formData.price,
                category: formData.category,
                images: imageUrls,
                detail_images: detailImageUrls,
                description: formData.description,
                stock: formData.stock,
                is_available: formData.is_available,
                details: {
                    colors: formData.colors,
                    sizes: formData.sizes,
                    features: formData.features
                },
                is_best: formData.is_best,
                is_new: formData.is_new,
                is_celeb_pick: formData.is_celeb_pick,
                celeb_pick_image_index: formData.is_celeb_pick ? formData.celeb_pick_image_index : null,
                discount_percent: formData.discount_percent,
            };

            if (editingProduct) {
                // 수정
                const { error } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", editingProduct.id);

                if (error) throw error;
                toast.success("상품이 수정되었습니다");
                setShowModal(false);
                resetForm();
            } else {
                // 추가
                const { error } = await supabase
                    .from("products")
                    .insert([productData]);

                if (error) throw error;

                if (isContinue) {
                    toast.success("상품이 추가되었습니다. 다음 상품을 입력해주세요.");
                    resetForm();
                    // 모달 유지
                } else {
                    toast.success("상품이 추가되었습니다");
                    setShowModal(false);
                    resetForm();
                }
            }

            // 브랜드 한글명이 입력된 경우 별칭 저장
            if (formData.brand && brandKoreanName.trim()) {
                const upperBrand = formData.brand.toUpperCase();
                const aliases = brandKoreanName.split(',').map(a => a.trim()).filter(a => a);
                if (aliases.length > 0) {
                    const updatedAliases = { ...brandAliases, [upperBrand]: aliases };
                    await saveBrandAliasesAction(updatedAliases);
                    setBrandAliases(updatedAliases);
                }
            }

            fetchProducts();
        } catch (error) {
            console.error("Error:", error);
            toast.error("오류가 발생했습니다");
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
            detailImages: [],
            existingDetailImages: product.detail_images || [],
            description: product.description,
            stock: product.stock,
            is_available: product.is_available,
            is_best: product.is_best || false,
            is_new: product.is_new || false,
            is_celeb_pick: product.is_celeb_pick || false,
            celeb_pick_image_index: product.celeb_pick_image_index || 0,
            discount_percent: product.discount_percent || 0,
            colors: product.details?.colors || [],
            sizes: product.details?.sizes || [],
            features: product.details?.features || []
        });
        // 한글명 불러오기
        if (brandAliases[product.brand]) {
            setBrandKoreanName(brandAliases[product.brand].join(', '));
        } else {
            setBrandKoreanName('');
        }
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
            toast.success("상품이 삭제되었습니다");
            fetchProducts();
        } else {
            console.error("Delete error:", error);
            toast.error(`삭제 실패: ${error.message}`);
        }
        setShowDeleteConfirm(false);
        setDeleteTargetId(null);
    };

    // Bulk delete functions
    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === currentProducts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentProducts.map(p => p.id));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) {
            toast.error("삭제할 상품을 선택해주세요");
            return;
        }
        setShowBulkDeleteConfirm(true);
    };

    const confirmBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const { error } = await supabase
            .from("products")
            .delete()
            .in("id", selectedIds);

        if (!error) {
            toast.success(`${selectedIds.length}개 상품이 삭제되었습니다`);
            setSelectedIds([]);
            fetchProducts();
        } else {
            console.error("Bulk delete error:", error);
            toast.error(`삭제 실패: ${error.message}`);
        }
        setShowBulkDeleteConfirm(false);
    };

    // Excel 템플릿 다운로드
    const downloadTemplate = () => {
        const templateData = [
            {
                "카테고리": "BAG",
                "브랜드": "BRAND NAME",
                "상품명": "샘플 상품명",
                "색상정보": "Black, White",
                "사이즈정보": "S, M, L",
                "가격": 1000000,
                "재고": 10,
                "상품설명": "상품에 대한 상세 설명을 입력하세요.",
                "이미지1": "https://xxx.supabase.co/storage/v1/object/public/product-images/sample1.jpg",
                "이미지2": "",
                "이미지3": "",
                "이미지4": "",
                "이미지5": "",
                "이미지6": "",
                "이미지7": "",
                "이미지8": "",
                "이미지9": "",
                "이미지10": ""
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "상품목록");

        // 열 너비 설정
        ws['!cols'] = [
            { wch: 12 }, // 카테고리
            { wch: 15 }, // 브랜드
            { wch: 20 }, // 상품명
            { wch: 20 }, // 색상정보
            { wch: 15 }, // 사이즈정보
            { wch: 12 }, // 가격
            { wch: 8 },  // 재고
            { wch: 40 }, // 상품설명
            { wch: 60 }, // 이미지1
            { wch: 60 }, // 이미지2
            { wch: 60 }, // 이미지3
            { wch: 60 }, // 이미지4
            { wch: 60 }, // 이미지5
            { wch: 60 }, // 이미지6
            { wch: 60 }, // 이미지7
            { wch: 60 }, // 이미지8
            { wch: 60 }, // 이미지9
            { wch: 60 }, // 이미지10
        ];

        XLSX.writeFile(wb, "상품등록_양식.xlsx");
        toast.success("템플릿이 다운로드되었습니다 (이미지 URL 칸럼 포함)");
    };

    // 이미지 URL 검증 함수
    const isValidImageUrl = (url: string): boolean => {
        if (!url || url.trim() === "") return false;
        // URL 형식 기본 검증 (http/https로 시작, 이미지 확장자)
        const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i;
        return urlPattern.test(url.trim());
    };

    // Excel 파일 업로드 처리
    const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                const parsedData: BulkProductData[] = jsonData.map((row: any) => {
                    // 메인 이미지 URL 추출 (이미지1-2)
                    const mainImageUrls: string[] = [];
                    for (let i = 1; i <= 2; i++) {
                        const imgUrl = row[`이미지${i}`];
                        if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '') {
                            if (isValidImageUrl(imgUrl)) {
                                mainImageUrls.push(imgUrl.trim());
                            }
                        }
                    }

                    // 상세페이지 이미지 URL 추출 (이미지3-10)
                    const detailImageUrls: string[] = [];
                    for (let i = 3; i <= 10; i++) {
                        const imgUrl = row[`이미지${i}`];
                        if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '') {
                            if (isValidImageUrl(imgUrl)) {
                                detailImageUrls.push(imgUrl.trim());
                            }
                        }
                    }

                    return {
                        category: row["카테고리"] || "BAG",
                        brand: row["브랜드"] || "",
                        name: row["상품명"] || "",
                        colors: row["색상정보"] || "",
                        sizes: row["사이즈정보"] || "",
                        price: Number(row["가격"]) || 0,
                        stock: Number(row["재고"]) || 0,
                        features: "",
                        description: row["상품설명"] || "",
                        images: mainImageUrls,
                        detailImages: detailImageUrls,
                    };
                });

                // 필수 항목 검증
                const validData = parsedData.filter(item => item.name && item.brand && item.price > 0);

                if (validData.length === 0) {
                    toast.error("유효한 상품 데이터가 없습니다");
                    return;
                }

                // 기존 상품과 중복 체크 (브랜드 + 상품명 기준)
                const dataWithDuplicateCheck = validData.map(item => {
                    const existingProduct = products.find(
                        p => p.brand.toUpperCase() === item.brand.toUpperCase() &&
                            p.name.toLowerCase() === item.name.toLowerCase()
                    );
                    return {
                        ...item,
                        isDuplicate: !!existingProduct,
                        existingProductId: existingProduct?.id
                    };
                });

                const duplicates = dataWithDuplicateCheck.filter(item => item.isDuplicate);
                setDuplicateCount(duplicates.length);
                setDuplicateAction('ask'); // 매번 초기화

                // 이미지 포함 통계
                const withMainImages = dataWithDuplicateCheck.filter(item => item.images.length > 0);
                const withDetailImages = dataWithDuplicateCheck.filter(item => item.detailImages.length > 0);
                const totalMainImages = dataWithDuplicateCheck.reduce((sum, item) => sum + item.images.length, 0);
                const totalDetailImages = dataWithDuplicateCheck.reduce((sum, item) => sum + item.detailImages.length, 0);

                setBulkUploadData(dataWithDuplicateCheck);
                setShowBulkUploadModal(true);

                if (duplicates.length > 0) {
                    toast.warning(`${dataWithDuplicateCheck.length}개 상품 중 ${duplicates.length}개 중복 발견`);
                } else {
                    toast.success(`${dataWithDuplicateCheck.length}개 상품 (메인 ${totalMainImages}장, 상세 ${totalDetailImages}장)`);
                }
            } catch (error) {
                console.error("Excel parse error:", error);
                toast.error("Excel 파일 파싱 중 오류가 발생했습니다");
            }
        };
        reader.readAsBinaryString(file);

        // 파일 input 초기화
        e.target.value = "";
    };

    // 일괄 등록 실행
    const executeBulkUpload = async () => {
        if (bulkUploadData.length === 0) return;

        setBulkUploading(true);

        try {
            // 중복 처리에 따라 데이터 분류
            const newProducts = bulkUploadData.filter(item => !item.isDuplicate);
            const duplicateProducts = bulkUploadData.filter(item => item.isDuplicate);

            let insertedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;

            // 신규 상품 등록
            if (newProducts.length > 0) {
                const productsToInsert = newProducts.map(item => ({
                    name: item.name,
                    brand: item.brand.toUpperCase(),
                    price: item.price,
                    category: CATEGORIES.includes(item.category.toUpperCase())
                        ? item.category.toUpperCase()
                        : "BAG",
                    stock: item.stock,
                    is_available: item.stock > 0,
                    description: item.description,
                    images: item.images || [],
                    detail_images: item.detailImages || [],
                    details: {
                        colors: item.colors ? [{ name: item.colors, value: "#000000" }] : [],
                        sizes: item.sizes ? item.sizes.split(",").map(s => s.trim()) : [],
                        features: [],
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
                                    price: item.price,
                                    stock: item.stock,
                                    is_available: item.stock > 0,
                                    description: item.description,
                                    images: item.images || [],
                                    detail_images: item.detailImages || [],
                                    details: {
                                        colors: item.colors ? [{ name: item.colors, value: "#000000" }] : [],
                                        sizes: item.sizes ? item.sizes.split(",").map(s => s.trim()) : [],
                                        features: [],
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
            }

            // 결과 메시지
            const messages = [];
            if (insertedCount > 0) messages.push(`${insertedCount}개 신규 등록`);
            if (updatedCount > 0) messages.push(`${updatedCount}개 업데이트`);
            if (skippedCount > 0) messages.push(`${skippedCount}개 스킵`);

            toast.success(messages.join(', ') || '처리 완료');

            setShowBulkUploadModal(false);
            setBulkUploadData([]);
            setDuplicateCount(0);
            setDuplicateAction('ask');
            fetchProducts();
        } catch (error: any) {
            console.error("Bulk upload error:", error);
            toast.error(`일괄 등록 실패: ${error.message}`);
        } finally {
            setBulkUploading(false);
        }
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
            detailImages: [],
            existingDetailImages: [],
            description: "",
            stock: 0,
            is_available: true,
            is_best: false,
            is_new: false,
            discount_percent: 0,
            colors: [],
            sizes: [],
            features: []
        });
        setBrandKoreanName('');
    };

    if (!isMounted) return null;

    const lowStockCount = products.filter(product => product.stock < 5).length;

    return (
        <div>
            {/* Title Row */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">상품 관리</h1>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${lowStockCount > 0
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        <span className={`text-sm font-bold ${lowStockCount > 0
                            ? 'text-orange-700'
                            : 'text-gray-500'
                            }`}>
                            재고부족 {lowStockCount}건
                        </span>
                    </div>
                    <button
                        onClick={fetchProducts}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {/* 템플릿 다운로드 */}
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">양식 다운로드</span>
                        <span className="sm:hidden">양식</span>
                    </button>

                    {/* 일괄 업로드 */}
                    <label className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="hidden sm:inline">일괄 업로드</span>
                        <span className="sm:hidden">일괄업로드</span>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleBulkFileUpload}
                            className="hidden"
                        />
                    </label>

                    {/* 상품 추가 */}
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        상품 추가
                    </button>
                </div>
            </div>

            {/* Search Row */}
            <div className="mb-8 mt-4">
                <AdminSearch
                    value={searchTerm}
                    onChange={(val) => {
                        setSearchTerm(val);
                        setCurrentPage(1);
                    }}
                    placeholder="상품명, 브랜드, 카테고리 검색..."
                />
            </div>

            {/* Bulk Delete Row */}
            {selectedIds.length > 0 && (
                <div className="mb-4 flex items-center gap-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-sm font-medium text-red-700">
                        {selectedIds.length}개 상품 선택됨
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        선택 삭제
                    </button>
                    <button
                        onClick={() => setSelectedIds([])}
                        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        선택 취소
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                {/* Desktop Table View */}
                <table className="w-full hidden md:table">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-center w-12">
                                <input
                                    type="checkbox"
                                    checked={currentProducts.length > 0 && selectedIds.length === currentProducts.length}
                                    onChange={toggleSelectAll}
                                    className="w-5 h-5 text-indigo-600 border-2 border-gray-400 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                />
                            </th>
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
                                <td colSpan={9} className="px-6 py-4 text-center">로딩 중...</td>
                            </tr>
                        ) : currentProducts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-4 text-center">검색 결과가 없습니다.</td>
                            </tr>
                        ) : (
                            currentProducts.map((product) => (
                                <tr
                                    key={product.id}
                                    className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(product.id) ? 'bg-indigo-50' : ''}`}
                                >
                                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </td>
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
                                        <div className="flex gap-4">
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
                    {/* Mobile Select All Header */}
                    {!loading && currentProducts.length > 0 && (
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={currentProducts.length > 0 && selectedIds.length === currentProducts.length}
                                onChange={toggleSelectAll}
                                className="w-5 h-5 text-indigo-600 border-2 border-gray-400 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                            />
                            <span className="text-sm font-medium text-gray-700">전체 선택</span>
                        </div>
                    )}
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">로딩 중...</div>
                    ) : currentProducts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">검색 결과가 없습니다.</div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {currentProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className={`p-4 flex gap-4 ${selectedIds.includes(product.id) ? 'bg-indigo-50' : ''}`}
                                >
                                    {/* Checkbox */}
                                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </div>
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
                                            <div className="flex gap-5">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#001E10] to-[#000000] opacity-95" />

                    {/* Brand Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <h1
                            className="text-[15vw] font-bold text-[#D4AF37] opacity-10 select-none whitespace-nowrap tracking-widest"
                            style={{ fontFamily: 'var(--font-cinzel), serif' }}
                        >
                            ESSENTIA
                        </h1>
                    </div>

                    <div className="relative z-10 bg-[#FDFCF5] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#D4AF37]/30 shadow-xl">
                        <div className="sticky top-0 bg-[#FDFCF5] border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingProduct ? "상품 수정" : "상품 추가"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                {/* 이미지 업로드 섹션 */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-2">상품 이미지</label>
                                    <p className="text-xs text-gray-500 mb-2">※ 첫 번째 이미지가 대표 이미지(썸네일)로 사용됩니다. 드래그하여 순서를 변경할 수 있습니다.</p>

                                    {/* 업로드 버튼 + 베스트/신상 체크박스 */}
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
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
                                        {/* 베스트/신상/셀럽픽 체크박스 */}
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_best || false}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_best: e.target.checked }))}
                                                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                />
                                                <span className="text-sm font-medium text-orange-600">베스트</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_new || false}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_new: e.target.checked }))}
                                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                />
                                                <span className="text-sm font-medium text-green-600">신상</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_celeb_pick || false}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_celeb_pick: e.target.checked }))}
                                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                />
                                                <span className="text-sm font-medium text-purple-600">셀럽PICK</span>
                                            </label>
                                            {/* 셀럽PICK 이미지 선택 드롭다운 */}
                                            {formData.is_celeb_pick && (formData.existingImages?.length || 0) + formData.images.length > 1 && (
                                                <select
                                                    value={formData.celeb_pick_image_index || 0}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, celeb_pick_image_index: parseInt(e.target.value) }))}
                                                    className="px-2 py-1 text-sm border border-purple-300 rounded-lg bg-purple-50 text-purple-700 focus:ring-purple-500 focus:border-purple-500"
                                                >
                                                    {[...(formData.existingImages || []), ...formData.images.map((f, i) => `새이미지${i + 1}`)].map((_, idx) => (
                                                        <option key={idx} value={idx}>
                                                            {idx + 1}번 이미지
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    {/* 이미지 미리보기 그리드 */}
                                    <div className="grid grid-cols-5 gap-4">
                                        {/* 기존 이미지 표시 */}
                                        {formData.existingImages?.map((url, index) => {
                                            const actualIndex = index;
                                            const isDragging = draggedImageType === 'existing' && draggedImageIndex === index;
                                            const isDragOver = dragOverImageIndex === actualIndex;
                                            return (
                                                <div
                                                    key={`existing-${index}`}
                                                    draggable
                                                    onDragStart={(e) => handleImageDragStart(e, index, 'existing')}
                                                    onDragOver={(e) => handleImageDragOver(e, index, 'existing')}
                                                    onDrop={(e) => handleImageDrop(e, index, 'existing')}
                                                    onDragEnd={handleImageDragEnd}
                                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-50 border-blue-500 scale-95' :
                                                        isDragOver ? 'border-blue-400 ring-2 ring-blue-200' :
                                                            'border-gray-200 hover:border-gray-400'
                                                        }`}
                                                >
                                                    <Image src={url} alt={`Existing ${index}`} fill unoptimized className="object-cover pointer-events-none" />
                                                    {/* 순서 번호 뱃지 */}
                                                    <div className={`absolute top-1 left-1 text-white text-xs px-2 py-0.5 rounded-full font-bold ${actualIndex === 0 ? 'bg-green-600' : 'bg-gray-600'
                                                        }`}>
                                                        {actualIndex === 0 ? '메인' : actualIndex + 1}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingImage(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {/* 새 이미지 표시 */}
                                        {formData.images.map((file, index) => {
                                            const actualIndex = (formData.existingImages?.length || 0) + index;
                                            const isDragging = draggedImageType === 'new' && draggedImageIndex === index;
                                            const isDragOver = dragOverImageIndex === actualIndex;
                                            return (
                                                <div
                                                    key={`new-${index}`}
                                                    draggable
                                                    onDragStart={(e) => handleImageDragStart(e, index, 'new')}
                                                    onDragOver={(e) => handleImageDragOver(e, index, 'new')}
                                                    onDrop={(e) => handleImageDrop(e, index, 'new')}
                                                    onDragEnd={handleImageDragEnd}
                                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-50 border-blue-500 scale-95' :
                                                        isDragOver ? 'border-blue-400 ring-2 ring-blue-200' :
                                                            'border-green-300 hover:border-green-400'
                                                        }`}
                                                >
                                                    <Image src={imagePreviewUrls[index]} alt={`New ${index}`} fill unoptimized className="object-cover pointer-events-none" />
                                                    {/* 순서 번호 뱃지 */}
                                                    <div className={`absolute top-1 left-1 text-white text-xs px-2 py-0.5 rounded-full font-bold ${actualIndex === 0 ? 'bg-green-600' : 'bg-blue-600'
                                                        }`}>
                                                        {actualIndex === 0 ? '메인' : `NEW ${actualIndex + 1}`}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 상세 페이지 이미지 업로드 섹션 */}
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <label className="block text-sm font-medium mb-2 text-blue-800">📄 상세 페이지 이미지</label>
                                    <p className="text-xs text-blue-600 mb-3">※ 상세 페이지에 순서대로 표시될 이미지입니다. (860 X 1100 PX 권장, 긴 이미지 권장)</p>

                                    {/* 업로드 버튼 */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors">
                                            <Upload className="w-4 h-4 text-blue-700" />
                                            <span className="text-blue-700">상세 이미지 선택</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleDetailImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                        <span className="text-sm text-blue-600">
                                            {formData.detailImages.length + (formData.existingDetailImages?.length || 0)}개 이미지
                                        </span>
                                    </div>

                                    {/* 이미지 미리보기 그리드 */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* 기존 상세 이미지 표시 */}
                                        {formData.existingDetailImages?.map((url, index) => (
                                            <div key={`existing-detail-${index}`} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-blue-300 bg-white">
                                                <Image src={url} alt={`Detail ${index}`} fill unoptimized className="object-cover" />
                                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {index + 1}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingDetailImage(index)}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* 새 상세 이미지 표시 */}
                                        {formData.detailImages.map((file, index) => (
                                            <div key={`new-detail-${index}`} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-blue-300 bg-white">
                                                <Image src={detailImagePreviewUrls[index]} alt={`New Detail ${index}`} fill unoptimized className="object-cover" />
                                                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                                                    NEW {(formData.existingDetailImages?.length || 0) + index + 1}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDetailImage(index)}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {(formData.detailImages.length + (formData.existingDetailImages?.length || 0)) === 0 && (
                                        <div className="text-center py-8 text-blue-400 border-2 border-dashed border-blue-200 rounded-lg">
                                            상세 페이지 이미지가 없습니다
                                        </div>
                                    )}
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
                                                const upperBrand = e.target.value.toUpperCase();
                                                setFormData(prev => ({ ...prev, brand: upperBrand }));
                                                setShowBrandSuggestions(true);
                                                // 기존 한글명 불러오기
                                                if (brandAliases[upperBrand]) {
                                                    setBrandKoreanName(brandAliases[upperBrand].join(', '));
                                                } else {
                                                    setBrandKoreanName('');
                                                }
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
                                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex justify-between items-center"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, brand: brand }));
                                                                setShowBrandSuggestions(false);
                                                                // 한글명 자동 불러오기
                                                                if (brandAliases[brand]) {
                                                                    setBrandKoreanName(brandAliases[brand].join(', '));
                                                                } else {
                                                                    setBrandKoreanName('');
                                                                }
                                                            }}
                                                        >
                                                            <span>{brand}</span>
                                                            {brandAliases[brand] && (
                                                                <span className="text-gray-400 text-xs">{brandAliases[brand].join(', ')}</span>
                                                            )}
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

                                {/* 브랜드 한글명 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        브랜드 한글명
                                        <span className="text-gray-400 font-normal ml-1">(검색용, 쉼표로 구분)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={brandKoreanName}
                                        onChange={(e) => setBrandKoreanName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="셀린느, 셀린"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        한글로 검색 시 이 브랜드로 매칭됩니다.
                                    </p>
                                </div>

                                {/* 가격 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">판매가 (원)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.price || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        {formData.price > 0 && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                ₩{formData.price.toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                </div>

                                {/* 할인율 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">할인율</label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {[0, 5, 10, 15].map((percent) => (
                                            <label key={percent} className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="discount"
                                                    checked={formData.discount_percent === percent}
                                                    onChange={() => setFormData(prev => ({ ...prev, discount_percent: percent }))}
                                                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                                />
                                                <span className={`text-sm ${percent > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                                    {percent === 0 ? '할인없음' : `${percent}%`}
                                                </span>
                                            </label>
                                        ))}
                                        {/* 임의 퍼센트 입력 */}
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="radio"
                                                name="discount"
                                                checked={![0, 5, 10, 15].includes(formData.discount_percent || 0)}
                                                onChange={() => setFormData(prev => ({ ...prev, discount_percent: 20 }))}
                                                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                max="99"
                                                placeholder="임의%"
                                                value={![0, 5, 10, 15].includes(formData.discount_percent || 0) ? formData.discount_percent : ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: parseInt(e.target.value) || 0 }))}
                                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-500">%</span>
                                        </div>
                                    </div>
                                    {/* 할인가 미리보기 */}
                                    {formData.price > 0 && (formData.discount_percent || 0) > 0 && (
                                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                                            <p className="flex items-center text-sm">
                                                <span className="font-bold text-gray-900">
                                                    판매가: ₩{Math.round(formData.price * (1 - (formData.discount_percent || 0) / 100)).toLocaleString()}
                                                </span>
                                            </p>
                                        </div>
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
                                                        // 중복 방지
                                                        if (!formData.colors.some(c => c.name === input.value)) {
                                                            setFormData({
                                                                ...formData,
                                                                colors: [...formData.colors, { name: input.value, value: input.value }]
                                                            });
                                                        }
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
                                                    if (!formData.colors.some(c => c.name === nameInput.value)) {
                                                        setFormData({
                                                            ...formData,
                                                            colors: [...formData.colors, { name: nameInput.value, value: nameInput.value }]
                                                        });
                                                    }
                                                    nameInput.value = '';
                                                }
                                            }}
                                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            추가
                                        </button>
                                    </div>
                                    {/* 빠른 추가 버튼 (색상) */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {['블랙', '베이지', '아이보리', '네이비', '브라운', '화이트', '그레이'].map(preset => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    if (!formData.colors.some(c => c.name === preset)) {
                                                        setFormData({
                                                            ...formData,
                                                            colors: [...formData.colors, { name: preset, value: preset }]
                                                        });
                                                    }
                                                }}
                                                className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                            >
                                                +{preset}
                                            </button>
                                        ))}
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
                                                        if (!formData.sizes.includes(input.value)) {
                                                            setFormData({
                                                                ...formData,
                                                                sizes: [...formData.sizes, input.value]
                                                            });
                                                        }
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
                                                    if (!formData.sizes.includes(input.value)) {
                                                        setFormData({
                                                            ...formData,
                                                            sizes: [...formData.sizes, input.value]
                                                        });
                                                    }
                                                    input.value = '';
                                                }
                                            }}
                                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            추가
                                        </button>
                                    </div>
                                    {/* 빠른 추가 버튼 (사이즈) */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {['220', '225', '230', '235', '240', '245', '250', '255', '260'].map(preset => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    if (!formData.sizes.includes(preset)) {
                                                        setFormData({
                                                            ...formData,
                                                            sizes: [...formData.sizes, preset]
                                                        });
                                                    }
                                                }}
                                                className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                            >
                                                +{preset}
                                            </button>
                                        ))}
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
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="px-4 py-2 bg-[#00704A] text-white rounded-lg hover:bg-[#005A3C] disabled:opacity-50 transition-colors"
                                    >
                                        {uploading ? "저장 중..." : (editingProduct ? "수정 완료" : "상품 추가")}
                                    </button>
                                    {!editingProduct && (
                                        <button
                                            type="submit"
                                            disabled={uploading}
                                            onClick={() => setIsContinue(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            {uploading ? "저장 중..." : "저장 후 계속 추가"}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#001E10] to-[#000000] opacity-95" />
                    <div className="relative z-10 bg-[#FDFCF5] p-6 rounded-lg max-w-sm w-full mx-4 border border-[#D4AF37]/30 shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">상품 삭제</h3>
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

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 text-red-600">⚠️ 일괄 삭제 확인</h3>
                        <p className="text-gray-600 mb-2">
                            선택한 <span className="font-bold text-red-600">{selectedIds.length}개</span> 상품을 삭제하시겠습니까?
                        </p>
                        <p className="text-sm text-gray-500 mb-6">이 작업은 되돌릴 수 없습니다.</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmBulkDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                {selectedIds.length}개 삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Upload Preview Modal */}
            {showBulkUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FileSpreadsheet className="w-6 h-6 text-purple-600" />
                                    상품 일괄 등록 미리보기
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowBulkUploadModal(false);
                                        setBulkUploadData([]);
                                        setDuplicateCount(0);
                                        setDuplicateAction('ask');
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* 통계 정보 */}
                            <div className="mt-4 flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">전체:</span>
                                    <span className="font-bold text-purple-600">{bulkUploadData.length}개</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">신규:</span>
                                    <span className="font-bold text-green-600">{bulkUploadData.filter(i => !i.isDuplicate).length}개</span>
                                </div>
                                {duplicateCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">중복:</span>
                                        <span className="font-bold text-orange-600">{duplicateCount}개</span>
                                    </div>
                                )}
                            </div>

                            {/* 중복 처리 옵션 */}
                            {duplicateCount > 0 && (
                                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-sm text-orange-800 font-medium mb-3">
                                        ⚠️ {duplicateCount}개 상품이 이미 등록되어 있습니다. 처리 방법을 선택하세요:
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setDuplicateAction('skip')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${duplicateAction === 'skip'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            ✓ 모두 스킵 (신규만 등록)
                                        </button>
                                        <button
                                            onClick={() => setDuplicateAction('update')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${duplicateAction === 'update'
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            ↻ 모두 업데이트 (덮어쓰기)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">#</th>
                                        <th className="px-3 py-2 text-left font-medium">상태</th>
                                        <th className="px-3 py-2 text-left font-medium">상품명</th>
                                        <th className="px-3 py-2 text-left font-medium">브랜드</th>
                                        <th className="px-3 py-2 text-right font-medium">가격</th>
                                        <th className="px-3 py-2 text-left font-medium">카테고리</th>
                                        <th className="px-3 py-2 text-right font-medium">재고</th>
                                        <th className="px-3 py-2 text-center font-medium">이미지</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {bulkUploadData.map((item, index) => (
                                        <tr
                                            key={index}
                                            className={`hover:bg-gray-50 ${item.isDuplicate ? 'bg-orange-50' : ''}`}
                                        >
                                            <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                                            <td className="px-3 py-2">
                                                {item.isDuplicate ? (
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                                        중복
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                        신규
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 font-medium">{item.name}</td>
                                            <td className="px-3 py-2 text-gray-600">{item.brand}</td>
                                            <td className="px-3 py-2 text-right">₩{item.price.toLocaleString()}</td>
                                            <td className="px-3 py-2">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right">{item.stock}</td>
                                            <td className="px-3 py-2 text-center text-gray-500 text-xs">
                                                {item.images.length > 0 || item.detailImages.length > 0
                                                    ? `${item.images.length}+${item.detailImages.length}`
                                                    : '-'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                {duplicateCount > 0 && duplicateAction === 'ask' && (
                                    <span className="text-orange-600">⚠️ 중복 처리 방법을 선택해주세요</span>
                                )}
                                {duplicateAction === 'skip' && (
                                    <span>{bulkUploadData.filter(i => !i.isDuplicate).length}개 신규 등록 예정</span>
                                )}
                                {duplicateAction === 'update' && (
                                    <span>{bulkUploadData.filter(i => !i.isDuplicate).length}개 신규 + {duplicateCount}개 업데이트 예정</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowBulkUploadModal(false);
                                        setBulkUploadData([]);
                                        setDuplicateCount(0);
                                        setDuplicateAction('ask');
                                    }}
                                    className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={executeBulkUpload}
                                    disabled={bulkUploading || (duplicateCount > 0 && duplicateAction === 'ask')}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {bulkUploading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            등록 중...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            등록 실행
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
