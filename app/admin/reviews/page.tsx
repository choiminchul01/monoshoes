"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Trash2, Star, Plus, X, Image as ImageIcon, RefreshCw } from "lucide-react";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";

type Review = {
    id: string;
    author_name: string;
    rating: number;
    content: string;
    created_at: string;
    is_admin_created: boolean;
    product: {
        id: string;
        name: string;
        image_url: string;
    };
};

type Product = {
    id: string;
    name: string;
    image_url: string;
};

export default function AdminReviewsPage() {
    const toast = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newReview, setNewReview] = useState({
        productId: "",
        authorName: "",
        rating: 5,
        content: "",
        image: null as File | null
    });
    const [productSearch, setProductSearch] = useState("");
    const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [currentPage]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            // Get reviews without join
            const { data: reviewsData, error: reviewsError } = await supabase
                .from("reviews")
                .select("*")
                .order("created_at", { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (reviewsError) throw reviewsError;

            // Get unique product IDs
            const productIds = [...new Set(reviewsData?.map(r => r.product_id).filter(Boolean))];

            // Fetch products separately
            const { data: productsData } = await supabase
                .from("products")
                .select("id, name, image_url")
                .in("id", productIds);

            // Create product map
            const productMap = new Map(productsData?.map(p => [p.id, p]) || []);

            // Combine reviews with products
            const reviewsWithProducts = reviewsData?.map(review => ({
                ...review,
                product: productMap.get(review.product_id) || null
            })) || [];

            setReviews(reviewsWithProducts);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("리뷰를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 이 리뷰를 삭제하시겠습니까?")) return;

        try {
            const { error } = await supabase.from("reviews").delete().eq("id", id);
            if (error) throw error;
            toast.success("리뷰가 삭제되었습니다.");
            fetchReviews();
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error("리뷰 삭제 중 오류가 발생했습니다.");
        }
    };

    // Product Search for Create Modal
    useEffect(() => {
        const searchProducts = async () => {
            if (productSearch.length < 2) {
                setSearchedProducts([]);
                return;
            }
            const { data } = await supabase
                .from("products")
                .select("id, name, image_url")
                .ilike("name", `%${productSearch}%`)
                .limit(5);
            setSearchedProducts(data || []);
        };
        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [productSearch]);

    const handleCreateReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !newReview.authorName || !newReview.content) {
            toast.error("모든 필수 항목을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = null;

            // Upload Image if exists
            if (newReview.image) {
                const fileExt = newReview.image.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('review-images')
                    .upload(fileName, newReview.image);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('review-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            const { error } = await supabase.from("reviews").insert({
                product_id: selectedProduct.id,
                author_name: newReview.authorName,
                rating: newReview.rating,
                content: newReview.content,
                image_url: imageUrl,
                is_admin_created: true
            });

            if (error) throw error;

            toast.success("리뷰가 생성되었습니다.");
            setIsCreateModalOpen(false);
            setNewReview({ productId: "", authorName: "", rating: 5, content: "", image: null });
            setSelectedProduct(null);
            setProductSearch("");
            fetchReviews();
        } catch (error) {
            console.error("Error creating review:", error);
            toast.error("리뷰 생성 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Search and filter reviews
    const getFilteredReviews = () => {
        let result = reviews;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.author_name.toLowerCase().includes(lowerTerm) ||
                r.content.toLowerCase().includes(lowerTerm) ||
                r.product?.name.toLowerCase().includes(lowerTerm)
            );
        }

        return result;
    };

    const filteredReviews = getFilteredReviews();
    const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
    const currentReviews = filteredReviews.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Calculate new reviews count (reviews within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newReviewsCount = reviews.filter(review =>
        new Date(review.created_at) > sevenDaysAgo
    ).length;

    return (
        <div>
            {/* Title Row */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">리뷰 관리</h1>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${newReviewsCount > 0
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        <span className={`text-sm font-bold ${newReviewsCount > 0
                            ? 'text-blue-700'
                            : 'text-gray-500'
                            }`}>
                            새 리뷰 {newReviewsCount}건
                        </span>
                    </div>
                    <button
                        onClick={fetchReviews}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    리뷰 생성
                </button>
            </div>

            {/* Search Row */}
            <div className="mb-8 mt-4">
                <AdminSearch
                    value={searchTerm}
                    onChange={(val) => {
                        setSearchTerm(val);
                        setCurrentPage(1);
                    }}
                    placeholder="작성자, 리뷰 내용, 상품명 검색..."
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평점</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">내용</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성일</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center">로딩 중...</td></tr>
                        ) : currentReviews.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">
                                {searchTerm ? '검색 결과가 없습니다.' : '등록된 리뷰가 없습니다.'}
                            </td></tr>
                        ) : (
                            currentReviews.map((review) => (
                                <tr key={review.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {review.product?.image_url && (
                                                <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100">
                                                    <Image src={review.product.image_url} alt={review.product.name} fill className="object-cover" />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium truncate max-w-[150px]">{review.product?.name || "삭제된 상품"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            {review.author_name}
                                            {review.is_admin_created && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">관리자</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-gray-300"}`} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 truncate max-w-xs">{review.content}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* Create Review Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">리뷰 생성 (관리자)</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateReview} className="space-y-4">
                            {/* Product Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">상품 선택</label>
                                {selectedProduct ? (
                                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-200">
                                            <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" />
                                        </div>
                                        <span className="font-medium text-sm flex-1">{selectedProduct.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProduct(null)}
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="상품명 검색..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        />
                                        {searchedProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                                                {searchedProducts.map(product => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedProduct(product);
                                                            setSearchedProducts([]);
                                                            setProductSearch("");
                                                        }}
                                                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 text-left"
                                                    >
                                                        <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-200">
                                                            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                                                        </div>
                                                        <span className="text-sm truncate">{product.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">작성자명 (표시용)</label>
                                <input
                                    type="text"
                                    value={newReview.authorName}
                                    onChange={(e) => setNewReview({ ...newReview, authorName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="예: 김철수"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">평점</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            className="focus:outline-none"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${star <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">리뷰 내용</label>
                                <textarea
                                    value={newReview.content}
                                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent h-32 resize-none"
                                    placeholder="리뷰 내용을 입력하세요..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">사진 첨부 (선택)</label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                        <ImageIcon className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-600">이미지 선택</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setNewReview({ ...newReview, image: e.target.files[0] });
                                                }
                                            }}
                                        />
                                    </label>
                                    {newReview.image && (
                                        <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                            {newReview.image.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                                >
                                    {isSubmitting ? "생성 중..." : "리뷰 생성"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
