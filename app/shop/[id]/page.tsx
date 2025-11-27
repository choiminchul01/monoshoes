"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Minus, Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getColorHex } from "@/lib/colorUtils";

type ProductDetails = {
    colors?: { name: string; value: string }[];
    sizes?: string[];
    features?: string[];
};

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
    details?: ProductDetails;
    created_at: string;
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [selectedColor, setSelectedColor] = useState<{ name: string; value: string } | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [openAccordion, setOpenAccordion] = useState<string | null>("details");
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [productId, setProductId] = useState<string | null>(null);

    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchProductData = async () => {
            const resolvedParams = await params;
            const id = resolvedParams.id;

            setLoading(true);

            const { data: productData, error: productError } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .single();

            if (productError || !productData) {
                console.error("Error fetching product:", productError);
                setLoading(false);
                return;
            }

            const foundProduct = productData as Product;
            setProduct(foundProduct);
            setProductId(foundProduct.id);

            if (foundProduct.details?.colors && foundProduct.details.colors.length > 0) {
                setSelectedColor(foundProduct.details.colors[0]);
            }
            if (foundProduct.details?.sizes && foundProduct.details.sizes.length > 0) {
                setSelectedSize(foundProduct.details.sizes[0]);
            }

            const { data: relatedData, error: relatedError } = await supabase
                .from("products")
                .select("*")
                .eq("category", foundProduct.category)
                .neq("id", foundProduct.id)
                .limit(4);

            if (!relatedError && relatedData) {
                setRelatedProducts(relatedData as Product[]);
            }

            setLoading(false);
        };

        fetchProductData();
    }, [params]);

    if (loading) {
        return <div className="container mx-auto px-4 py-20 text-center">Loading...</div>;
    }

    if (!product) {
        return <div className="container mx-auto px-4 py-20 text-center">Product not found</div>;
    }

    const toggleAccordion = (section: string) => {
        setOpenAccordion(openAccordion === section ? null : section);
    };

    const handleAddToCart = () => {
        if (product.details?.colors && product.details.colors.length > 0 && !selectedColor) {
            alert("Please select a color");
            return;
        }
        if (product.details?.sizes && product.details.sizes.length > 0 && !selectedSize) {
            alert("Please select a size");
            return;
        }

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || "/placeholder-product.jpg",
            color: selectedColor?.name,
            size: selectedSize || undefined,
            quantity: quantity,
            brand: product.brand,
        });
        alert("Added to cart!");
    };

    const handleBuyNow = () => {
        handleAddToCart();
    };

    const handleWishlistClick = async () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        if (!productId) return;

        try {
            await toggleWishlist(productId);
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            alert("찜하기에 실패했습니다. 다시 시도해주세요.");
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="text-center space-y-6">
                            <Heart className="w-16 h-16 mx-auto text-[#C41E3A]" />
                            <h2 className="text-2xl font-bold text-gray-900">로그인이 필요합니다</h2>
                            <p className="text-gray-600">찜하기 기능을 사용하려면 로그인이 필요합니다.</p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push("/login")}
                                    className="w-full h-12 bg-black text-white font-bold tracking-wider hover:bg-gray-800 transition-colors uppercase"
                                >
                                    로그인
                                </button>
                                <button
                                    onClick={() => router.push("/signup")}
                                    className="w-full h-12 border border-black text-black font-bold tracking-wider hover:bg-black hover:text-white transition-colors uppercase"
                                >
                                    회원가입
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-16">
                {/* Left: Image Gallery */}
                <div className="w-full lg:w-5/12 space-y-4">
                    <div className="relative aspect-[3/4] w-full max-h-[50vh] lg:max-h-none bg-gray-50 overflow-hidden mx-auto">
                        {product.images && product.images.length > 0 ? (
                            <Image
                                src={product.images[currentImageIndex]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-4">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`relative aspect-[3/4] bg-gray-50 overflow-hidden transition-all ${currentImageIndex === index ? "ring-1 ring-black opacity-100" : "opacity-70 hover:opacity-100"
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`View ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Product Info */}
                <div className="w-full lg:w-7/12 lg:sticky lg:top-24 h-fit">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="space-y-2">
                            <h2 className="text-sm font-bold text-[#C41E3A] tracking-widest">
                                {product.brand}
                            </h2>
                            <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-3 pt-2">
                                <span className="text-2xl font-bold text-gray-900">
                                    {product.price.toLocaleString()} KRW
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200" />

                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {product.description}
                        </p>

                        {/* Options */}
                        <div className="space-y-8">
                            {/* Color */}
                            {product.details?.colors && product.details.colors.length > 0 && (
                                <div className="space-y-4">
                                    <span className="text-xs font-bold text-gray-900 tracking-widest uppercase block">
                                        Color: {selectedColor?.name}
                                    </span>
                                    <div className="flex gap-3">
                                        {product.details.colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-all ${selectedColor?.name === color.name ? "ring-1 ring-black ring-offset-2" : ""
                                                    }`}
                                                style={{ backgroundColor: getColorHex(color.name) }}
                                                aria-label={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size */}
                            {product.details?.sizes && product.details.sizes.length > 0 && (
                                <div className="space-y-4">
                                    <span className="text-xs font-bold text-gray-900 tracking-widest uppercase block">
                                        Size
                                    </span>
                                    <div className="flex gap-3">
                                        {product.details.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[3rem] h-10 px-3 border text-sm font-medium transition-all ${selectedSize === size
                                                    ? "border-black bg-black text-white"
                                                    : "border-gray-200 text-gray-900 hover:border-black"
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="space-y-4">
                                <span className="text-xs font-bold text-gray-900 tracking-widest uppercase block">
                                    Quantity
                                </span>
                                <div className="flex items-center border border-gray-200 w-fit">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-[1fr_auto] gap-4 pt-4">
                            <button
                                onClick={handleAddToCart}
                                className="h-14 bg-black text-white text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase"
                            >
                                Add to Cart
                            </button>

                            <button
                                onClick={handleWishlistClick}
                                className={`row-span-2 w-20 border flex items-center justify-center transition-colors ${productId && isInWishlist(productId)
                                    ? "bg-white border-[#C41E3A]"
                                    : "bg-white border-[#C41E3A] hover:bg-gray-50"
                                    }`}
                            >
                                <Heart
                                    className={`w-11 h-11 transition-colors ${productId && isInWishlist(productId)
                                        ? "text-[#C41E3A] fill-[#C41E3A]"
                                        : "text-[#C41E3A]"
                                        }`}
                                    strokeWidth={1}
                                />
                            </button>

                            <button
                                onClick={handleBuyNow}
                                className="h-14 border border-black text-black text-sm font-bold tracking-widest hover:bg-black hover:text-white transition-colors uppercase"
                            >
                                Buy Now
                            </button>
                        </div>

                        {/* Accordions */}
                        <div className="border-t border-gray-200 pt-8 space-y-2">
                            {product.details?.features && product.details.features.length > 0 && (
                                <div className="border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => toggleAccordion("details")}
                                        className="w-full flex items-center justify-between py-2 text-xs font-bold tracking-widest uppercase hover:text-gray-600 transition-colors"
                                    >
                                        <span>Details</span>
                                        {openAccordion === "details" ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                    {openAccordion === "details" && (
                                        <div className="pt-4 pb-2 text-sm text-gray-600 leading-relaxed">
                                            <ul className="list-disc list-inside space-y-1">
                                                {product.details.features.map((feature, index) => (
                                                    <li key={index}>{feature}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="border-b border-gray-200 pb-4">
                                <button
                                    onClick={() => toggleAccordion("shipping")}
                                    className="w-full flex items-center justify-between py-2 text-xs font-bold tracking-widest uppercase hover:text-gray-600 transition-colors"
                                >
                                    <span>Shipping & Returns</span>
                                    {openAccordion === "shipping" ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>
                                {openAccordion === "shipping" && (
                                    <div className="pt-4 pb-2 text-sm text-gray-600 leading-relaxed">
                                        Free standard shipping on all orders. Returns are accepted within 30 days of purchase.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="mt-32">
                    <h3 className="text-xl font-light tracking-tight mb-12 text-center">YOU MAY ALSO LIKE</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {relatedProducts.map((product) => (
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
                </div>
            )}
        </div>
    );
}
