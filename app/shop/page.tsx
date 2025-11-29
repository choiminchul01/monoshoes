"use client";

import { useState, useEffect, Suspense } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Sidebar } from "@/components/shop/Sidebar";
import { Crown, Sparkles, Filter, X, Search } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

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
    created_at: string;
};

function ShopContent() {
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get("category");
    const selectedBrand = searchParams.get("brand");
    const urlSearchTerm = searchParams.get("search"); // URL에서 검색어 가져오기

    const [products, setProducts] = useState<Product[]>([]);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [bestSellersCount, setBestSellersCount] = useState(4);
    const [newArrivalsCount, setNewArrivalsCount] = useState(4);
    const [searchTerm, setSearchTerm] = useState(urlSearchTerm || ""); // 초기값을 URL 검색어로 설정
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (urlSearchTerm) {
            setSearchTerm(urlSearchTerm);
        }
    }, [urlSearchTerm]);

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_available', true);

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data || []);
            }
            setIsLoading(false);
        };

        fetchProducts();
    }, []);

    // Reset counts when filters change
    useEffect(() => {
        setBestSellersCount(4);
        setNewArrivalsCount(4);
    }, [selectedCategory, selectedBrand, searchTerm]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter products based on category, brand, and search term
    const filterProducts = (productList: Product[]) => {
        return productList.filter(product => {
            const matchCategory = selectedCategory ? product.category === selectedCategory : true;
            const matchBrand = selectedBrand ? product.brand.toUpperCase() === selectedBrand.toUpperCase() : true;
            const matchSearch = searchTerm
                ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.brand.toLowerCase().includes(searchTerm.toLowerCase())
                : true;
            return matchCategory && matchBrand && matchSearch;
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Search is already handled by state, but we can add analytics or other logic here
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-12">
                <AnimatePresence>
                    {(selectedCategory || isMobileFilterOpen) && (
                        <>
                            {/* Mobile Filter Overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={`fixed inset-0 bg-black/50 z-40 md:hidden ${isMobileFilterOpen ? 'block' : 'hidden'}`}
                                onClick={() => setIsMobileFilterOpen(false)}
                            />

                            {/* Sidebar Container */}
                            <motion.div
                                initial={{ width: 0, opacity: 0, x: -20 }}
                                animate={{ width: "auto", opacity: 1, x: 0 }}
                                exit={{ width: 0, opacity: 0, x: -20 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className={`
                                        fixed inset-y-0 left-0 z-50 bg-white w-64 p-6 shadow-2xl md:shadow-none md:static md:bg-transparent md:p-0 md:block overflow-hidden
                                        ${isMobileFilterOpen ? 'block' : 'hidden md:block'}
                                    `}
                            >
                                <div className="flex justify-between items-center mb-6 md:hidden">
                                    <span className="font-bold text-lg">FILTERS</span>
                                    <button onClick={() => setIsMobileFilterOpen(false)}>
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="w-full">
                                    <Sidebar />
                                </div>
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

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mb-8 relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-12 py-3 border-b border-gray-300 focus:border-black outline-none bg-transparent transition-colors placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-black transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </form>

                    {searchTerm ? (
                        // Search Results View
                        <>
                            <h1 className="mb-8 text-lg font-light tracking-tight flex items-center gap-2">
                                SEARCH RESULTS
                                <Search className="w-5 h-5 text-gray-400" />
                            </h1>

                            {allFilteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                    {allFilteredProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            id={product.id}
                                            brand={product.brand}
                                            name={product.name}
                                            price={product.price}
                                            imageUrl={product.images?.[0]}
                                            aspectRatio="aspect-[3/4]"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500 font-light">
                                    No products found matching "{searchTerm}".
                                </div>
                            )}
                        </>
                    ) : (
                        // Default View (Best Sellers & New Arrivals)
                        <>
                            {BEST_SELLERS.length > 0 && (
                                <>
                                    <h1 className="mb-8 text-lg font-light tracking-tight flex items-center gap-2">
                                        BEST SELLERS
                                        <Crown className="w-5 h-5 text-yellow-600" fill="currentColor" />
                                    </h1>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                        {isLoading ? (
                                            // 로딩 중 스켈레톤 표시
                                            [...Array(4)].map((_, index) => (
                                                <ProductCardSkeleton key={index} aspectRatio="aspect-[1000/1618]" />
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
                                                    aspectRatio="aspect-[1000/1618]"
                                                    index={idx}
                                                />
                                            ))
                                        )}
                                    </div>

                                    {bestSellersCount < BEST_SELLERS.length && (
                                        <div className="flex justify-center mb-24">
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

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 md:gap-x-16 mb-12">
                                        {isLoading ? (
                                            // 로딩 중 스켈레톤 표시
                                            [...Array(4)].map((_, index) => (
                                                <ProductCardSkeleton key={index} aspectRatio="aspect-square" />
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
                                                    aspectRatio="aspect-square"
                                                    index={idx}
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

                            {BEST_SELLERS.length === 0 && NEW_ARRIVALS.length === 0 && (
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
