"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Heart, X } from "lucide-react";

type Product = {
    id: string;
    name: string;
    brand: string;
    price: number;
    images: string[];
    category: string;
};

export default function WishlistPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { wishlist, toggleWishlist } = useWishlist();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirectTo=/mypage/wishlist");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && wishlist.length > 0) {
            fetchWishlistProducts();
        } else if (user && wishlist.length === 0) {
            setProducts([]);
            setLoading(false);
        }
    }, [user, wishlist]);

    const fetchWishlistProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .in("id", wishlist);

        if (!error && data) {
            setProducts(data as Product[]);
        }
        setLoading(false);
    };

    const handleRemoveFromWishlist = async (productId: string) => {
        try {
            await toggleWishlist(productId);
        } catch (error) {
            console.error("Error removing from wishlist:", error);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/mypage"
                        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
                    >
                        ← 마이페이지로 돌아가기
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">찜한 상품</h1>
                    <p className="text-gray-600">
                        <span className="font-bold">{products.length}</span>개의 상품을 찜하셨습니다
                    </p>
                </div>

                {/* Wishlist Content */}
                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        찜한 상품을 불러오는 중...
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600 mb-2 text-lg font-medium">
                            찜한 상품이 없습니다
                        </p>
                        <p className="text-gray-500 mb-6 text-sm">
                            마음에 드는 상품을 찜해보세요!
                        </p>
                        <Link
                            href="/shop"
                            className="inline-block px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            쇼핑하러 가기
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-12">
                        {products.map((product) => (
                            <div key={product.id} className="group relative">
                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveFromWishlist(product.id)}
                                    className="absolute top-2 right-2 z-10 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label="찜하기 해제"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>

                                <Link href={`/shop/${product.id}`} className="block">
                                    {/* Product Image */}
                                    <div className="relative aspect-[3/4] w-full bg-gray-50 overflow-hidden mb-4">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-[#C41E3A] tracking-widest uppercase">
                                            {product.brand}
                                        </p>
                                        <h3 className="text-sm font-light text-gray-900 line-clamp-2 min-h-[2.5rem]">
                                            {product.name}
                                        </h3>
                                        <p className="text-base font-bold text-gray-900 pt-1">
                                            {product.price.toLocaleString()}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
