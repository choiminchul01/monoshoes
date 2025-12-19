"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Minus, Plus, ChevronDown, ChevronUp, Star, Lock, MessageCircle, Share2, Link, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter, notFound } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import ProductQnA from "@/components/product/ProductQnA";
import ProductFloatingBar from "@/components/shop/ProductFloatingBar";
import { formatPrice } from "@/lib/utils";

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
    original_price?: number;
    discount_percent?: number;
    category: string;
    images: string[];
    detail_images?: string[];
    description: string;
    stock: number;
    is_available: boolean;
    details?: ProductDetails;
    created_at: string;
};

type Review = {
    id: string;
    author_name: string;
    rating: number;
    content: string;
    image_url: string | null;
    created_at: string;
    is_admin_created: boolean;
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
    const [productId, setProductId] = useState<string | null>(null);

    const { addToCart, setBuyNowItem } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);
    const [isFlying, setIsFlying] = useState(false);
    const [flyTarget, setFlyTarget] = useState({ top: "40px", left: "calc(100% - 40px)" }); // Default fallback

    // Calculate Cart Icon Position for Animation
    useEffect(() => {
        const updateFlyTarget = () => {
            const cartIcon = document.getElementById("header-cart-icon");
            if (cartIcon) {
                const rect = cartIcon.getBoundingClientRect();
                setFlyTarget({
                    top: `${rect.top + rect.height / 2}px`,
                    left: `${rect.left + rect.width / 2}px`,
                });
            }
        };

        // Update on mount and resize
        updateFlyTarget();
        window.addEventListener("resize", updateFlyTarget);
        return () => window.removeEventListener("resize", updateFlyTarget);
    }, []);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                const resolvedParams = await params;
                const id = resolvedParams.id;

                // UUID 유효성 검사
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(id)) {
                    console.error(`Invalid UUID format: ${id}`);
                    notFound();
                    return;
                }

                setLoading(true);

                const { data: productData, error: productError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (productError || !productData) {
                    console.error("Product not found:", productError);
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

                const { data: relatedData } = await supabase
                    .from("products")
                    .select("*")
                    .eq("category", foundProduct.category)
                    .neq("id", foundProduct.id)
                    .limit(4);

                if (relatedData) {
                    setRelatedProducts(relatedData as Product[]);
                }
            } catch (error) {
                console.error("Error in fetchProductData:", error);
            } finally {
                setLoading(false);
            }
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

    const handleAddToCart = async () => {
        if (!product) return;

        if (!user) {
            toast.error("회원 전용 서비스입니다. 로그인 또는 회원가입이 필요합니다.");
            router.push("/login");
            return;
        }

        if (product.details?.colors && product.details.colors.length > 0 && !selectedColor) {
            toast.error("색상을 선택해주세요.");
            return;
        }
        if (product.details?.sizes && product.details.sizes.length > 0 && !selectedSize) {
            toast.error("사이즈를 선택해주세요.");
            return;
        }

        setIsAddingToCart(true);
        setIsFlying(true); // Start animation

        // UX를 위한 인위적 지연
        await new Promise(resolve => setTimeout(resolve, 800));

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

        toast.success("장바구니에 담겼습니다!");
        setIsAddingToCart(false);
    };

    const handleBuyNow = async () => {
        if (!product) return;

        if (!user) {
            toast.error("회원 전용 서비스입니다. 로그인 또는 회원가입이 필요합니다.");
            router.push("/login");
            return;
        }

        if (product.details?.colors && product.details.colors.length > 0 && !selectedColor) {
            toast.error("색상을 선택해주세요.");
            return;
        }
        if (product.details?.sizes && product.details.sizes.length > 0 && !selectedSize) {
            toast.error("사이즈를 선택해주세요.");
            return;
        }

        setIsBuyingNow(true);

        const buyNowProduct = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || "/placeholder-product.jpg",
            color: selectedColor?.name,
            size: selectedSize || undefined,
            quantity: quantity,

            brand: product.brand,
            selected: true
        };

        setBuyNowItem(buyNowProduct);

        // Optional: Also save to local storage for persistence across reloads if needed
        localStorage.setItem("buyNowItem", JSON.stringify(buyNowProduct));

        toast.success("주문 페이지로 이동합니다.");
        router.push("/checkout?mode=buynow");
    };

    const handleWishlistClick = async () => {
        if (!user) {
            toast.error("로그인이 필요합니다.");
            router.push('/login');
            return;
        }

        if (!productId) return;

        try {
            await toggleWishlist(productId);
            if (isInWishlist(productId)) {
                toast.info("위시리스트에서 제거되었습니다.");
            } else {
                toast.success("위시리스트에 추가되었습니다.");
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            toast.error("작업에 실패했습니다.");
        }
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareTitle = product?.name || 'ESSENTIA';
        const shareText = `${product?.brand} - ${product?.name}`;

        // Try native Web Share API first (mostly mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fall back to clipboard
                if ((err as Error).name === 'AbortError') return;
            }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('링크가 복사되었습니다!');
        } catch (err) {
            // Final fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toast.success('링크가 복사되었습니다!');
        }
    };

    return (
        <div className="container mx-auto px-4 pt-0 pb-6 md:pb-12 md:pt-0 relative">
            {/* Flying Image Animation */}
            <AnimatePresence>
                {isFlying && product?.images?.[0] && (
                    <motion.div
                        initial={{ position: "fixed", top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1, opacity: 1, zIndex: 100 }}
                        animate={{
                            top: flyTarget.top,
                            left: flyTarget.left,
                            scale: 0.1,
                            opacity: 0.5
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        onAnimationComplete={() => setIsFlying(false)}
                        className="pointer-events-none"
                    >
                        <Image
                            src={product.images[0]}
                            alt="Flying product"
                            width={300}
                            height={400}
                            className="rounded-lg shadow-2xl object-cover"
                            unoptimized
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row gap-2 lg:gap-16">
                {/* Left: Image Gallery */}
                <div className="w-full lg:w-5/12 space-y-4">
                    {/* Main Image with Swipe */}
                    <motion.div
                        className="relative aspect-[3/4] w-full max-h-[60vh] lg:max-h-none bg-gray-50 overflow-hidden mx-auto cursor-grab active:cursor-grabbing rounded-2xl select-none"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = offset.x;
                            const swipeVelocity = velocity.x;

                            // 스와이프 임계값
                            const swipeThreshold = 50;
                            const velocityThreshold = 500;

                            if (product.images && product.images.length > 1) {
                                if (swipe < -swipeThreshold || swipeVelocity < -velocityThreshold) {
                                    // 왼쪽으로 스와이프 - 다음 이미지
                                    setCurrentImageIndex((prev) =>
                                        prev < product.images.length - 1 ? prev + 1 : prev
                                    );
                                } else if (swipe > swipeThreshold || swipeVelocity > velocityThreshold) {
                                    // 오른쪽으로 스와이프 - 이전 이미지
                                    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
                                }
                            }
                        }}
                    >
                        {product.images && product.images.length > 0 ? (
                            <Image
                                src={product.images[currentImageIndex]}
                                alt={product.name}
                                fill
                                draggable={false}
                                className="object-cover pointer-events-none"
                                priority
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}

                        {/* 투명 오버레이 - 이미지 직접 접근 차단 */}
                        <div className="absolute inset-0 z-[5]" />

                        {/* Swipe Indicators (Dots) - 모바일에서만 표시 */}
                        {product.images && product.images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 lg:hidden">
                                {product.images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === index
                                            ? "bg-white w-6"
                                            : "bg-white/50"
                                            }`}
                                        aria-label={`이미지 ${index + 1}로 이동`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Thumbnail Grid - 데스크톱에서만 표시 */}
                    {product.images && product.images.length > 1 && (
                        <div className="hidden lg:grid grid-cols-4 gap-4">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`relative aspect-[3/4] bg-gray-50 overflow-hidden transition-all rounded-lg ${currentImageIndex === index
                                        ? "ring-1 ring-black opacity-100"
                                        : "opacity-70 hover:opacity-100"
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`View ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
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
                            <div className="flex items-center gap-2 md:gap-3 pt-2 flex-wrap">
                                {authLoading ? (
                                    <div className="h-5 md:h-6 w-24 md:w-32 bg-gray-100 animate-pulse rounded" />
                                ) : user ? (
                                    <>
                                        <p className="text-base md:text-xl font-normal text-gray-900">
                                            {formatPrice(product.price)}
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Lock className="w-3 h-3 md:w-4 md:h-4" />
                                        <p className="text-xs md:text-sm font-medium tracking-wide">
                                            회원 전용
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Options Section - Redesigned 2x2 Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Color */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <span className="text-xs font-bold text-gray-500 tracking-widest uppercase block mb-3">
                                    Color
                                </span>
                                {product.details?.colors && product.details.colors.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {product.details.colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => setSelectedColor(color)}
                                                className={`min-w-[3rem] h-11 px-3 text-sm font-medium transition-all rounded-lg ${selectedColor?.name === color.name
                                                    ? "bg-[#faf7eb] text-gray-900 border-2 border-[#D4AF37] shadow-md"
                                                    : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                                                    }`}
                                            >
                                                {color.name.split('#')[0].trim()}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                )}
                            </div>

                            {/* Size */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <span className="text-xs font-bold text-gray-500 tracking-widest uppercase block mb-3">
                                    Size
                                </span>
                                {product.details?.sizes && product.details.sizes.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {product.details.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[3rem] h-11 px-3 text-sm font-medium transition-all rounded-lg ${selectedSize === size
                                                    ? "bg-[#faf7eb] text-gray-900 border-2 border-[#D4AF37] shadow-md"
                                                    : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                )}
                            </div>

                            {/* Details/Features */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <span className="text-xs font-bold text-gray-500 tracking-widest uppercase block mb-3">
                                    Details
                                </span>
                                {product.details?.features && product.details.features.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {product.details.features.slice(0, 3).map((feature, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center h-11 px-3 text-sm font-medium bg-[#faf7eb] text-gray-900 border-2 border-[#D4AF37] rounded-lg"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                        {product.details.features.length > 3 && (
                                            <span className="inline-flex items-center h-11 px-3 text-sm text-gray-400 bg-white border border-gray-200 rounded-lg">
                                                +{product.details.features.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                )}
                            </div>

                            {/* Quantity */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <span className="text-xs font-bold text-gray-500 tracking-widest uppercase block mb-3">
                                    Quantity
                                </span>
                                <div className="flex items-center bg-white border border-gray-200 w-fit rounded-lg overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-14 text-center text-base font-semibold text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions - Hidden on mobile (using fixed bottom bar instead) */}
                        <div id="main-product-actions" className="hidden md:grid grid-cols-2 lg:grid-cols-[1fr_auto_auto] gap-2 lg:gap-3 pt-4">
                            {/* Cart & Buy Now - Left side */}
                            <div className="space-y-2 col-span-1">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={handleAddToCart}
                                        disabled={!product.is_available}
                                        isLoading={isAddingToCart}
                                        loadingText="담는 중..."
                                        className="w-full h-12 bg-[#e9e4da] text-gray-900 text-sm font-bold tracking-widest hover:bg-[#ddd8ce] transition-colors uppercase rounded-xl"
                                    >
                                        {product.is_available ? "장바구니" : "품절"}
                                    </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={handleBuyNow}
                                        disabled={!product.is_available}
                                        isLoading={isBuyingNow}
                                        loadingText="처리 중..."
                                        className="w-full h-12 bg-[#4a5544] text-white text-sm font-bold tracking-widest hover:bg-[#3d4739] transition-colors uppercase rounded-xl"
                                    >
                                        바로구매
                                    </Button>
                                </motion.div>
                            </div>

                            {/* Wishlist & Share - Right side on mobile, separate on desktop */}
                            <div className="col-span-1 grid grid-cols-2 gap-2 lg:contents">
                                {/* Wishlist */}
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={handleWishlistClick}
                                    className={`w-full lg:w-24 h-full border-2 flex flex-col items-center justify-center transition-colors rounded-xl ${productId && isInWishlist(productId)
                                        ? "bg-white border-[#C41E3A]"
                                        : "bg-white border-[#C41E3A] hover:bg-gray-50"
                                        }`}
                                >
                                    <Heart
                                        className={`w-8 h-8 lg:w-10 lg:h-10 transition-colors ${productId && isInWishlist(productId)
                                            ? "text-[#C41E3A] fill-[#C41E3A]"
                                            : "text-[#C41E3A]"
                                            }`}
                                        strokeWidth={1.5}
                                    />
                                    <span className="text-xs font-bold text-gray-600 mt-1">찜하기</span>
                                </motion.button>

                                {/* Share Button - Kakao Style */}
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={handleShare}
                                    className="w-full lg:w-24 h-full bg-[#FEE500] border-2 border-[#FEE500] flex flex-col items-center justify-center transition-colors rounded-xl hover:bg-[#F5DC00]"
                                >
                                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#3C1E1E] rounded-full flex items-center justify-center">
                                        <span className="text-xs lg:text-base font-black text-[#FEE500] tracking-tighter">카톡</span>
                                    </div>
                                    <span className="text-xs font-bold text-[#3C1E1E] mt-1">공유하기</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* PC Floating Action Bar */}
                        <ProductFloatingBar
                            product={product}
                            isAddingToCart={isAddingToCart}
                            isBuyingNow={isBuyingNow}
                            isInWishlist={isInWishlist(product.id)}
                            onAddToCart={handleAddToCart}
                            onBuyNow={handleBuyNow}
                            onWishlist={handleWishlistClick}
                            onShare={handleShare}
                        />

                        {/* Description - Below Actions */}
                        <div className="pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Common Policy Images Section (이용 안내 - 1번 이미지) */}
            <div id="guide-section">
                <PolicyImagesSection
                    startId={1}
                    endId={1}
                    title="GUIDE"
                    subtitle="(이용 안내)"
                />
            </div>

            {/* Detail Images Section */}
            {product && product.detail_images && product.detail_images.length > 0 && (
                <DetailImagesSection images={product.detail_images} />
            )}

            {/* Common Policy Images Section (교환/환불 - 2,3번 이미지) */}
            <PolicyImagesSection
                startId={2}
                endId={3}
                title="POLICY"
                subtitle="(교환 / 환불)"
            />

            {/* Product Q&A Section */}
            {product && <ProductQnA productId={product.id} />}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="mt-32">
                    <h3 className="text-xl font-light tracking-tight mb-12 text-center">YOU MAY ALSO LIKE</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {relatedProducts.map((product, idx) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                brand={product.brand}
                                name={product.name}
                                price={product.price}
                                imageUrl={product.images?.[0]}
                                aspectRatio="aspect-[3/4]"
                                index={idx}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Mobile Bottom Fixed Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 min-[1600px]:hidden safe-area-pb">
                <div className="flex gap-2">
                    {/* 왼쪽: 장바구니 + 바로구매 (세로 스택) - 50% */}
                    <div className="w-1/2 flex flex-col gap-2">
                        <Button
                            onClick={handleAddToCart}
                            disabled={!product.is_available}
                            isLoading={isAddingToCart}
                            loadingText="..."
                            className="h-12 bg-[#e9e4da] text-gray-900 text-sm font-bold tracking-widest hover:bg-[#ddd8ce] transition-colors uppercase rounded-xl"
                        >
                            {product.is_available ? "장바구니" : "품절"}
                        </Button>
                        <Button
                            onClick={handleBuyNow}
                            disabled={!product.is_available}
                            isLoading={isBuyingNow}
                            loadingText="..."
                            className="h-12 bg-[#4a5544] text-white text-sm font-bold tracking-widest hover:bg-[#3d4739] transition-colors uppercase rounded-xl"
                        >
                            바로구매
                        </Button>
                    </div>

                    {/* 오른쪽: 찜하기 + 공유하기 - 50% */}
                    <div className="w-1/2 flex gap-2">
                        <button
                            onClick={handleWishlistClick}
                            className={`flex-1 h-full border-2 flex flex-col items-center justify-center transition-colors rounded-xl ${productId && isInWishlist(productId)
                                ? "bg-white border-[#C41E3A]"
                                : "bg-white border-[#C41E3A] hover:bg-gray-50"
                                }`}
                        >
                            <Heart
                                className={`w-9 h-9 transition-colors ${productId && isInWishlist(productId)
                                    ? "text-[#C41E3A] fill-[#C41E3A]"
                                    : "text-[#C41E3A]"
                                    }`}
                                strokeWidth={1.5}
                            />
                            <span className="text-sm font-bold text-gray-600 mt-1">찜하기</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 h-full bg-[#FEE500] border-2 border-[#FEE500] flex flex-col items-center justify-center transition-colors rounded-xl hover:bg-[#F5DC00]"
                        >
                            <div className="w-9 h-9 bg-[#3C1E1E] rounded-full flex items-center justify-center">
                                <span className="text-base font-black text-[#FEE500]">카톡</span>
                            </div>
                            <span className="text-sm font-bold text-[#3C1E1E] mt-1">공유하기</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom padding for fixed bar on mobile */}
            <div className="h-32 min-[1600px]:hidden" />
        </div>
    );
}

function ReviewSection({ productId }: { productId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            const { data } = await supabase
                .from("reviews")
                .select("*")
                .eq("product_id", productId)
                .order("created_at", { ascending: false });
            setReviews(data || []);
            setLoading(false);
        };
        fetchReviews();
    }, [productId]);

    if (loading) return <div className="py-12 text-center text-gray-400">Loading reviews...</div>;

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

    return (
        <div className="mt-24 border-t border-gray-200 pt-16 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <h3 className="text-2xl font-bold tracking-widest mb-6">REVIEWS ({reviews.length})</h3>

                {reviews.length > 0 && (
                    <div className="flex items-center justify-center gap-6">
                        <div className="text-5xl font-bold">{averageRating}</div>
                        <div className="flex flex-col items-start">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300"}`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500 mt-1">Based on {reviews.length} reviews</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">아직 작성된 리뷰가 없습니다.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-6">
                        {displayedReviews.map((review) => (
                            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <div className="flex gap-6">
                                    {/* Left: Review Image (1:1 ratio) */}
                                    {review.image_url && (
                                        <div className="flex-shrink-0">
                                            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                                                <Image
                                                    src={review.image_url}
                                                    alt="Review"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Right: Info & Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Author & Rating Row */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {/* Author Avatar */}
                                                <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold">
                                                    {review.author_name.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Author Info */}
                                                <div>
                                                    <p className="font-semibold text-gray-900">{review.author_name}</p>
                                                    <div className="flex gap-0.5 mt-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-4 h-4 ${star <= review.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-200"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(review.created_at).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>

                                        {/* Review Content */}
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {review.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Show More Button */}
                    {reviews.length > 3 && (
                        <div className="text-center mt-8">
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="px-8 py-3 border-2 border-black text-black font-bold tracking-widest hover:bg-black hover:text-white transition-all uppercase"
                            >
                                {showAll ? `접기` : `더보기 (${reviews.length - 3}개 더)`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// 상세 이미지 섹션 컴포넌트 (프리미엄 스크롤 애니메이션)
function DetailImagesSection({ images }: { images: string[] }) {
    return (
        <div className="mt-24 border-t border-gray-200 pt-16 max-w-5xl mx-auto">
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <h3 className="text-2xl font-bold tracking-widest mb-0.5">PRODUCT DETAILS</h3>
                <p className="text-2xl font-bold text-gray-800 tracking-widest mb-2">· HIGH QUALITY ·</p>
                <p className="text-base text-gray-500">(실제 상품 사진)</p>
            </motion.div>

            <div className="space-y-4">
                {images.map((imageUrl, index) => (
                    <motion.div
                        key={index}
                        className="relative w-full"
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{
                            duration: 0.8,
                            delay: index * 0.1,
                            ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                    >
                        <Image
                            src={imageUrl}
                            alt={`Product detail ${index + 1}`}
                            width={1200}
                            height={800}
                            className="w-full h-auto rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-500"
                            loading="lazy"
                            unoptimized
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// 공통 이용 안내 이미지 섹션 (배송/교환/환불 규정 - 전 상품 공통)
function PolicyImagesSection({
    startId = 1,
    endId = 3,
    title = "GUIDE & POLICY",
    subtitle = "(이용 안내)"
}: {
    startId?: number;
    endId?: number;
    title?: string;
    subtitle?: string;
}) {
    const [policyImages, setPolicyImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolicyImages = async () => {
            try {
                // Fetch all policy images dynamically
                const { fetchPolicyImagesAction } = await import('@/app/admin/settings/actions');
                const result = await fetchPolicyImagesAction();

                if (result.success && result.images) {
                    // Filter images by index range (startId to endId)
                    const filteredImages = result.images.filter((url: string, index: number) => {
                        const imageIndex = index + 1; // 1-based index
                        return imageIndex >= startId && imageIndex <= endId;
                    });
                    setPolicyImages(filteredImages);
                }
            } catch (error) {
                console.error('Failed to fetch policy images:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPolicyImages();
    }, [startId, endId]); // startId, endId 변경 시 재실행

    if (loading || policyImages.length === 0) return null;

    return (
        <div className="mt-24 border-t border-gray-200 pt-16 max-w-5xl mx-auto">
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <h3 className="text-2xl font-bold tracking-widest mb-0.5">{title}</h3>
                <p className="text-2xl font-bold text-gray-800 tracking-widest mb-2">· ESSENTIA ·</p>
                <p className="text-base text-gray-500">{subtitle}</p>
            </motion.div>

            <div className="space-y-4">
                {policyImages.map((imageUrl, index) => (
                    <motion.div
                        key={index}
                        className="relative w-full"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{
                            duration: 0.6,
                            delay: index * 0.1,
                            ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                    >
                        <Image
                            src={imageUrl}
                            alt={`${title} ${index + 1}`}
                            width={900}
                            height={1200}
                            className="w-full h-auto rounded-2xl"
                            loading="lazy"
                            unoptimized
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

