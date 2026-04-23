"use client";

import { useState, useEffect, Suspense } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Sidebar } from "@/components/shop/Sidebar";
import { Crown, Sparkles, Star, Filter, X, Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { fetchBrandAliasesAction, type BrandAliases } from "@/lib/brandAliases";
import { findMatchingBrands } from "@/lib/brandAliasUtils";

type Product = {
    id: string;
    name: string;
    brand: string;
    price: number;
    original_price?: number;
    category: string;
    images: string[];
    description: string;
    stock: number;
    is_available: boolean;
    is_best?: boolean;
    is_new?: boolean;
    is_celeb_pick?: boolean;
    celeb_pick_image_index?: number;
    discount_percent?: number;
    created_at: string;
};

function ShopContent() {
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get("category");
    const selectedBrand = searchParams.get("brand");
    const selectedGender = searchParams.get("gender");   // W / M
    const selectedFilter = searchParams.get("filter");   // best / new / sale
    const urlSearchTerm = searchParams.get("search");

    const [products, setProducts] = useState<Product[]>([]);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [bestSellersCount, setBestSellersCount] = useState(4);
    const [newArrivalsCount, setNewArrivalsCount] = useState(4);
    const [celebPickCount, setCelebPickCount] = useState(4);
    const [inputValue, setInputValue] = useState(urlSearchTerm || ""); // 입력값 (실시간)
    const [activeSearchTerm, setActiveSearchTerm] = useState(urlSearchTerm || ""); // 실제 검색어 (제출 시)
    const [isLoading, setIsLoading] = useState(true);
    const [brandAliases, setBrandAliases] = useState<BrandAliases>({});

    useEffect(() => {
        if (urlSearchTerm) {
            setInputValue(urlSearchTerm);
            setActiveSearchTerm(urlSearchTerm);
        }

        const fetchData = async () => {
            setIsLoading(true);

            // 상품과 브랜드 별칭 병렬 로드
            const [productsResult, aliasesResult] = await Promise.all([
                supabase
                    .from('products')
                    .select('*')
                    .eq('is_available', true)
                    .order("created_at", { ascending: false }),
                fetchBrandAliasesAction()
            ]);

            if (productsResult.error) {
                console.error('Error fetching products:', productsResult.error);
            } else {
                setProducts(productsResult.data || []);
            }

            if (aliasesResult.success && aliasesResult.aliases) {
                setBrandAliases(aliasesResult.aliases);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [urlSearchTerm]);

    // Reset counts when filters change
    useEffect(() => {
        setBestSellersCount(4);
        setNewArrivalsCount(4);
        setCelebPickCount(4);
    }, [selectedCategory, selectedBrand, activeSearchTerm]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter products based on category, brand, gender, filter, and search term
    const filterProducts = (productList: Product[]) => {
        return productList.filter(product => {
            const matchCategory = selectedCategory ? product.category === selectedCategory : true;
            const matchBrand = selectedBrand ? product.brand.toUpperCase() === selectedBrand.toUpperCase() : true;

            // 성별 필터 — category 코드 앞자리(W_/M_)로 판단
            const matchGender = selectedGender
                ? product.category?.startsWith(selectedGender + "_")
                : true;

            // 특수 필터
            let matchFilter = true;
            if (selectedFilter === "best") matchFilter = !!product.is_best;
            if (selectedFilter === "new") matchFilter = !!product.is_new;
            if (selectedFilter === "sale") matchFilter = (product.discount_percent ?? 0) > 0 || ((product.original_price ?? 0) > product.price);

            let matchSearch = true;
            if (activeSearchTerm) {
                const loweredSearch = activeSearchTerm.toLowerCase();
                const nameMatch = product.name.toLowerCase().includes(loweredSearch);
                const brandMatch = product.brand.toLowerCase().includes(loweredSearch);
                const matchedBrands = findMatchingBrands(activeSearchTerm, brandAliases);
                const aliasMatch = matchedBrands.some(mb => product.brand.toUpperCase() === mb.toUpperCase());
                matchSearch = nameMatch || brandMatch || aliasMatch;
            }

            return matchCategory && matchBrand && matchGender && matchFilter && matchSearch;
        });
    };

    const allFilteredProducts = filterProducts(products);

    // Split into New Arrivals and Best Sellers
    // Logic updated to ensure both sections are populated regardless of product dates
    const sortedByDate = [...allFilteredProducts].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // New Arrivals: Top 4 newest products
    let NEW_ARRIVALS = sortedByDate.slice(0, 4);

    // Best Sellers: The rest, or if not enough products, just show all/random
    // For this demo, we'll use the remaining products, or if empty, reuse some products to fill the UI
    let BEST_SELLERS = sortedByDate.slice(4);

    if (BEST_SELLERS.length === 0 && sortedByDate.length > 0) {
        // If we have few products (<=4), show them in both or just split them differently
        // Let's just duplicate them for visual fullness if the user wants to see both sections
        BEST_SELLERS = sortedByDate;
    }

    // CELEB'S PICK: is_celeb_pick이 true인 상품
    const CELEB_PICKS = allFilteredProducts.filter(p => p.is_celeb_pick);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed.length === 0) {
            // 빈 검색어면 검색 초기화
            setActiveSearchTerm("");
            return;
        }
        if (trimmed.length < 2) {
            alert("2글자 이상 입력해주세요.");
            return;
        }
        setActiveSearchTerm(trimmed);
    };

    const handleClearSearch = () => {
        setInputValue("");
        setActiveSearchTerm("");
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-12">
                {/* 데스크탑 사이드바 — 항상 표시 */}
                <div className="hidden md:block">
                    <Sidebar onFilterSelect={() => setIsMobileFilterOpen(false)} />
                </div>

                {/* 모바일 필터 오버레이 */}
                <AnimatePresence>
                    {isMobileFilterOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                                onClick={() => setIsMobileFilterOpen(false)}
                            />
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 left-0 z-50 bg-white w-72 p-6 shadow-2xl md:hidden overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-lg tracking-widest">카테고리</span>
                                    <button onClick={() => setIsMobileFilterOpen(false)}>
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <Sidebar onFilterSelect={() => setIsMobileFilterOpen(false)} />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setIsMobileFilterOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 border border-black rounded-full text-sm font-medium hover:bg-black hover:text-white transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            FILTERS
                        </button>

                        {(selectedCategory || selectedBrand) && (
                            <div className="flex gap-2">
                                {selectedCategory && (
                                    <span className="px-3 py-1 bg-black text-white text-xs tracking-widest uppercase">
                                        {selectedCategory}
                                    </span>
                                )}
                                {selectedBrand && (
                                    <span className="px-3 py-1 bg-gray-200 text-black text-xs tracking-widest uppercase">
                                        {selectedBrand}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>


                    {activeSearchTerm ? (
                        // Search Results View
                        <>
                            <h1 className="mb-8 text-lg font-light tracking-tight flex items-center gap-2">
                                SEARCH RESULTS
                                <Search className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-400">(&quot;{activeSearchTerm}&quot;)</span>
                            </h1>

                            {allFilteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                    {allFilteredProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            id={product.id}
                                            brand={product.brand}
                                            name={product.name}
                                            price={product.price}
                                            imageUrl={product.images?.[0]}
                                            aspectRatio="aspect-[3/4]"
                                            discount_percent={product.discount_percent}
                                            is_best={product.is_best}
                                            is_new={product.is_new}
                                            originalPrice={product.original_price}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500 font-light">
                                    No products found matching &quot;{activeSearchTerm}&quot;.
                                </div>
                            )}
                        </>
                    ) : (
                        // Default View (Best Sellers & New Arrivals)
                        <>
                            {/* CELEB'S PICK - 1순위 */}
                            {CELEB_PICKS.length > 0 && (
                                <>
                                    <h2 className="mb-8 text-lg font-light tracking-tight flex items-center gap-2">
                                        CELEB'S PICK
                                        <Star className="w-5 h-5 text-purple-600" fill="currentColor" />
                                    </h2>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                        {isLoading ? (
                                            // 로딩 중 스켈레톤 표시
                                            [...Array(4)].map((_, index) => (
                                                <ProductCardSkeleton key={index} aspectRatio="aspect-[3/4]" />
                                            ))
                                        ) : (
                                            // 실제 상품 표시
                                            CELEB_PICKS.slice(0, celebPickCount).map((product, idx) => {
                                                const celebImageIndex = product.celeb_pick_image_index ?? 0;
                                                const celebImageUrl = product.images?.[celebImageIndex] || product.images?.[0];
                                                return (
                                                    <ProductCard
                                                        key={product.id}
                                                        id={product.id}
                                                        brand={product.brand}
                                                        name={product.name}
                                                        price={product.price}
                                                        imageUrl={celebImageUrl}
                                                        aspectRatio="aspect-[3/4]"
                                                        index={idx}
                                                        discount_percent={product.discount_percent}
                                                        is_best={product.is_best}
                                                        is_new={product.is_new}
                                                        originalPrice={product.original_price}
                                                    />
                                                );
                                            })
                                        )}
                                    </div>

                                    {celebPickCount < CELEB_PICKS.length && (
                                        <div className="flex justify-center mb-16">
                                            <button
                                                onClick={() => setCelebPickCount((prev) => Math.min(prev + 4, CELEB_PICKS.length))}
                                                className="px-5 py-1.5 bg-transparent border border-black text-black text-xs font-medium hover:bg-black hover:text-white transition-colors rounded-full tracking-widest uppercase"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {BEST_SELLERS.length > 0 && (
                                <>
                                    <h1 className="mb-8 text-lg font-light tracking-tight flex items-center gap-2">
                                        {selectedFilter === 'best' ? '베스트 상품' :
                                         selectedFilter === 'new' ? '신상품' :
                                         selectedFilter === 'sale' ? '세일 상품' :
                                         selectedGender === 'W' ? '여성 신발' :
                                         selectedGender === 'M' ? '남성 신발' :
                                         'ALL SHOES'}
                                        <Crown className="w-5 h-5 text-yellow-600" fill="currentColor" />
                                    </h1>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                        {isLoading ? (
                                            // 로딩 중 스켈레톤 표시
                                            [...Array(4)].map((_, index) => (
                                                <ProductCardSkeleton key={index} aspectRatio="aspect-[3/4]" />
                                            ))
                                        ) : (
                                            // 실제 상품 표시
                                            BEST_SELLERS.slice(0, bestSellersCount).map((product, idx) => (
                                                <ProductCard
                                                    key={product.id}
                                                    id={product.id}
                                                    brand={product.brand}
                                                    name={product.name}
                                                    price={product.price}
                                                    imageUrl={product.images?.[0]}
                                                    aspectRatio="aspect-[3/4]"
                                                    index={idx}
                                                    discount_percent={product.discount_percent}
                                                    is_best={product.is_best}
                                                    is_new={product.is_new}
                                                    originalPrice={product.original_price}
                                                />
                                            ))
                                        )}
                                    </div>

                                    {bestSellersCount < BEST_SELLERS.length && (
                                        <div className="flex justify-center mb-16">
                                            <button
                                                onClick={() => setBestSellersCount((prev) => Math.min(prev + 4, BEST_SELLERS.length))}
                                                className="px-5 py-1.5 bg-transparent border border-black text-black text-xs font-medium hover:bg-black hover:text-white transition-colors rounded-full tracking-widest uppercase"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {NEW_ARRIVALS.length > 0 && (
                                <>
                                    <h2 className="mb-8 text-lg font-light tracking-tight flex items-center gap-2">
                                        NEW ARRIVALS
                                        <Sparkles className="w-5 h-5 text-yellow-600" fill="currentColor" />
                                    </h2>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                        {isLoading ? (
                                            // 로딩 중 스켈레톤 표시
                                            [...Array(4)].map((_, index) => (
                                                <ProductCardSkeleton key={index} aspectRatio="aspect-[3/4]" />
                                            ))
                                        ) : (
                                            // 실제 상품 표시
                                            NEW_ARRIVALS.slice(0, newArrivalsCount).map((product, idx) => (
                                                <ProductCard
                                                    key={product.id}
                                                    id={product.id}
                                                    brand={product.brand}
                                                    name={product.name}
                                                    price={product.price}
                                                    imageUrl={product.images?.[0]}
                                                    aspectRatio="aspect-[3/4]"
                                                    index={idx}
                                                    discount_percent={product.discount_percent}
                                                    is_best={product.is_best}
                                                    is_new={product.is_new}
                                                    originalPrice={product.original_price}
                                                />
                                            ))
                                        )}
                                    </div>

                                    {newArrivalsCount < NEW_ARRIVALS.length && (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setNewArrivalsCount((prev) => Math.min(prev + 4, NEW_ARRIVALS.length))}
                                                className="px-5 py-1.5 bg-transparent border border-black text-black text-xs font-medium hover:bg-black hover:text-white transition-colors rounded-full tracking-widest uppercase"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {BEST_SELLERS.length === 0 && NEW_ARRIVALS.length === 0 && CELEB_PICKS.length === 0 && (
                                <div className="text-center py-20 text-gray-500 font-light">
                                    No products found.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-12">
                <div className="text-center text-gray-600">Loading products...</div>
            </div>
        }>
            <ShopContent />
        </Suspense>
    );
}
