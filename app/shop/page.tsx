"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Sidebar } from "@/components/shop/Sidebar";
import { Filter, X, Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { fetchBrandAliasesAction, type BrandAliases } from "@/lib/brandAliases";
import { findMatchingBrands } from "@/lib/brandAliasUtils";

// 카테고리별 배너 설정
const BANNER_CONFIG: Record<string, { img: string; subtitle: string; title: string; desc: string }> = {
    best:  { img: "/banners/banner_best.png",  subtitle: "Best Seller",    title: "BEST",  desc: "고객이 가장 많이 선택한 인기 아이템" },
    new:   { img: "/banners/banner_new.png",   subtitle: "New Arrival",    title: "NEW",   desc: "지금 막 도착한 최신 컬렉션" },
    sale:  { img: "/banners/banner_sale.png",  subtitle: "Special Price",  title: "SALE",  desc: "한정 수량 특가 혜택을 누려보세요" },
    shop:  { img: "/banners/banner_shop.png",  subtitle: "All Collection", title: "SHOP",  desc: "모든 컬렉션을 한 곳에서" },
};

function CategoryBanner({ filterKey }: { filterKey: string }) {
    const cfg = BANNER_CONFIG[filterKey] ?? BANNER_CONFIG.shop;
    return (
        <div className="relative w-full mb-10 overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
            <Image
                src={cfg.img}
                alt={cfg.title}
                fill
                className="object-cover"
                priority
            />
            {/* 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-start items-start p-8 md:p-12 pt-10 md:pt-16">
                <p className="text-[#ff6b6b] text-[10px] tracking-[0.4em] font-black uppercase mb-2">{cfg.subtitle}</p>
                <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight mb-4"
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                    {cfg.title}
                </h2>
                <p className="text-white/70 text-sm font-light tracking-wide max-w-[80%]">{cfg.desc}</p>
            </div>
        </div>
    );
}

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
    const [bestSellersCount, setBestSellersCount] = useState(8);
    const [celebPickCount, setCelebPickCount] = useState(4);
    const [inputValue, setInputValue] = useState(urlSearchTerm || ""); // 입력값 (실시간)
    const [activeSearchTerm, setActiveSearchTerm] = useState(urlSearchTerm || ""); // 실제 검색어 (제출 시)
    const [isLoading, setIsLoading] = useState(true);
    const [brandAliases, setBrandAliases] = useState<BrandAliases>({});
    const [sortBy, setSortBy] = useState("newest"); // newest, price_asc, price_desc
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
        setBestSellersCount(8);
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

    const finalFilteredProducts = [...allFilteredProducts].sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // MD PICK: is_celeb_pick이 true인 상품
    const MD_PICKS = allFilteredProducts.filter(p => p.is_celeb_pick);

    // ALL SHOES: 전체 필터링된 상품
    const ALL_PRODUCTS = [...allFilteredProducts].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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

    const isSpecialFilterView = ["best", "new", "sale"].includes(selectedFilter || "");

    if (!isMounted) return null; // Hydration mismatch 방지

    const sortUI = (
        <div className="flex justify-between items-end mb-6">
            <div className="text-sm text-gray-500 font-light">
                총 <span className="font-bold text-black">{finalFilteredProducts.length}</span>개의 상품
            </div>
            <div className="flex items-center gap-3 text-[13px] text-gray-400">
                <button onClick={() => setSortBy("newest")} className={`transition-colors hover:text-black ${sortBy === "newest" ? "text-black font-medium" : ""}`}>최신순</button>
                <div className="w-[1px] h-3 bg-gray-200"></div>
                <button onClick={() => setSortBy("price_asc")} className={`transition-colors hover:text-black ${sortBy === "price_asc" ? "text-black font-medium" : ""}`}>가격낮은순</button>
                <div className="w-[1px] h-3 bg-gray-200"></div>
                <button onClick={() => setSortBy("price_desc")} className={`transition-colors hover:text-black ${sortBy === "price_desc" ? "text-black font-medium" : ""}`}>가격높은순</button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-12 md:items-start">
                {/* 데스크탑 사이드바 — 특가/베스트/신상품 페이지에서는 숨김 */}
                {!isSpecialFilterView && (
                    <div className="hidden md:block sticky top-24 self-start flex-shrink-0">
                        <Sidebar onFilterSelect={() => setIsMobileFilterOpen(false)} />
                    </div>
                )}

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

                <div className="flex-1 w-full min-w-0">
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        {/* Mobile Filter Button */}
                        {!isSpecialFilterView && (
                            <button
                                onClick={() => setIsMobileFilterOpen(true)}
                                className="md:hidden flex items-center gap-2 px-4 py-2 border border-black rounded-full text-sm font-medium hover:bg-black hover:text-white transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                FILTERS
                            </button>
                        )}

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

                    {/* 카테고리 배너 (검색 중에는 숨김) */}
                    {!activeSearchTerm && (
                        <CategoryBanner filterKey={selectedFilter ?? (selectedGender || selectedCategory ? 'shop' : 'shop')} />
                    )}

                    {activeSearchTerm ? (
                        // Search Results View
                        <>
                            <div className="mb-16 text-center">
                                <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3 flex items-center justify-center gap-2">
                                    Search Results
                                    <Search className="w-3 h-3 text-[#C41E3A]" />
                                </p>
                                <div className="inline-block">
                                    <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                                        &quot;{activeSearchTerm}&quot;
                                    </h1>
                                </div>
                            </div>
                            {finalFilteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                    {finalFilteredProducts.map((product) => (
                                        <ProductCard key={product.id} id={product.id} brand={product.brand} name={product.name} price={product.price} imageUrl={product.images?.[0]} aspectRatio="aspect-[3/4]" discount_percent={product.discount_percent} is_best={product.is_best} is_new={product.is_new} originalPrice={product.original_price} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500 font-light">No products found matching &quot;{activeSearchTerm}&quot;.</div>
                            )}
                        </>
                    ) : selectedFilter === 'best' ? (
                        // BEST 전용 뷰
                        <>
                            <div className="mb-16 text-center">
                                <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">Best Seller</p>
                                <div className="inline-block">
                                    <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>BEST</h2>
                                </div>
                            </div>
                            {sortUI}
                            {finalFilteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                    {isLoading ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[3/4]" />) :
                                        finalFilteredProducts.map((product, idx) => (
                                            <ProductCard key={product.id} id={product.id} brand={product.brand} name={product.name} price={product.price} imageUrl={product.images?.[0]} aspectRatio="aspect-[3/4]" index={idx} discount_percent={product.discount_percent} is_best={product.is_best} is_new={product.is_new} originalPrice={product.original_price} />
                                        ))
                                    }
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400 font-light">
                                    <p className="text-5xl mb-4">🏆</p>
                                    <p>베스트 상품이 없습니다.</p>
                                    <p className="text-sm mt-2">관리자 페이지에서 상품에 베스트 표시를 설정해주세요.</p>
                                </div>
                            )}
                        </>
                    ) : selectedFilter === 'new' ? (
                        // NEW 전용 뷰
                        <>
                            <div className="mb-16 text-center">
                                <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">New Arrival</p>
                                <div className="inline-block">
                                    <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>NEW</h2>
                                </div>
                            </div>
                            {sortUI}
                            {finalFilteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                    {isLoading ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[3/4]" />) :
                                        finalFilteredProducts.map((product, idx) => (
                                            <ProductCard key={product.id} id={product.id} brand={product.brand} name={product.name} price={product.price} imageUrl={product.images?.[0]} aspectRatio="aspect-[3/4]" index={idx} discount_percent={product.discount_percent} is_best={product.is_best} is_new={product.is_new} originalPrice={product.original_price} />
                                        ))
                                    }
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400 font-light">
                                    <p className="text-5xl mb-4">✨</p>
                                    <p>신상품이 없습니다.</p>
                                    <p className="text-sm mt-2">관리자 페이지에서 상품에 신상품 표시를 설정해주세요.</p>
                                </div>
                            )}
                        </>
                    ) : selectedFilter === 'sale' ? (
                        // SALE 전용 뷰
                        <>
                            <div className="mb-16 text-center">
                                <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">Special Price</p>
                                <div className="inline-block">
                                    <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>SALE</h2>
                                </div>
                            </div>
                            {sortUI}
                            {finalFilteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                    {isLoading ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[3/4]" />) :
                                        finalFilteredProducts.map((product, idx) => (
                                            <ProductCard key={product.id} id={product.id} brand={product.brand} name={product.name} price={product.price} imageUrl={product.images?.[0]} aspectRatio="aspect-[3/4]" index={idx} discount_percent={product.discount_percent} is_best={product.is_best} is_new={product.is_new} originalPrice={product.original_price} />
                                        ))
                                    }
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400 font-light">
                                    <p className="text-5xl mb-4">🏷️</p>
                                    <p>특가 상품이 없습니다.</p>
                                    <p className="text-sm mt-2">관리자 페이지에서 상품에 할인율을 설정해주세요.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        // Default View (Best Sellers & New Arrivals)
                        <>
                            {/* MD PICK - 1순위 */}
                            {MD_PICKS.length > 0 && (
                                <>
                                    <div className="mb-16 text-center mt-12">
                                        <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">MD's Selection</p>
                                        <div className="inline-block">
                                            <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>MD&apos;S PICK</h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                        {isLoading ? (
                                            // 로딩 중 스켈레톤 표시
                                            [...Array(4)].map((_, index) => (
                                                <ProductCardSkeleton key={index} aspectRatio="aspect-[3/4]" />
                                            ))
                                        ) : (
                                            // 실제 상품 표시
                                            MD_PICKS.slice(0, celebPickCount).map((product, idx) => {
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

                                    {celebPickCount < MD_PICKS.length && (
                                        <div className="flex justify-center mb-16">
                                            <button
                                                onClick={() => setCelebPickCount((prev) => Math.min(prev + 4, MD_PICKS.length))}
                                                className="px-5 py-1.5 bg-transparent border border-black text-black text-xs font-medium hover:bg-black hover:text-white transition-colors rounded-full tracking-widest uppercase"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {ALL_PRODUCTS.length > 0 && (
                                <>
                                    <div className="mb-16 text-center mt-20">
                                        <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">
                                            {selectedGender === 'W' ? 'Women Selection' : 
                                             selectedGender === 'M' ? 'Men Selection' : 
                                             'All Collection'}
                                        </p>
                                        <div className="inline-block">
                                            <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                                                {selectedGender === 'W' ? 'WOMEN SHOES' :
                                                 selectedGender === 'M' ? 'MEN SHOES' :
                                                 'ALL SHOES'}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                        {isLoading ? (
                                            // 로딩 중 스켈레톤 표시
                                            [...Array(4)].map((_, index) => (
                                                <ProductCardSkeleton key={index} aspectRatio="aspect-[3/4]" />
                                            ))
                                        ) : (
                                            // 실제 상품 표시
                                            ALL_PRODUCTS.slice(0, bestSellersCount).map((product, idx) => (
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

                                    {bestSellersCount < ALL_PRODUCTS.length && (
                                        <div className="flex justify-center mb-16">
                                            <button
                                                onClick={() => setBestSellersCount((prev) => Math.min(prev + 8, ALL_PRODUCTS.length))}
                                                className="px-5 py-1.5 bg-transparent border border-black text-black text-xs font-medium hover:bg-black hover:text-white transition-colors rounded-full tracking-widest uppercase"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {ALL_PRODUCTS.length === 0 && MD_PICKS.length === 0 && (
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
