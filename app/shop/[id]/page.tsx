"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Minus, Plus, ShoppingBag, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/shop/ProductCard";
import ProductDetailTabs from "@/components/shop/ProductDetailTabs";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter, notFound } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
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

const expandSizes = (sizes: string[]) => {
    const expanded = new Set<string>();
    sizes.forEach(size => {
        const strSize = String(size).trim();
        if (strSize.includes('~') || strSize.includes('-')) {
            const parts = strSize.split(/[-~]/).map(s => parseInt(s.replace(/[^0-9]/g, ''), 10));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                let [start, end] = parts;
                if (start > end) {
                    const temp = start;
                    start = end;
                    end = temp;
                }
                for (let i = start; i <= end; i += 5) {
                    expanded.add(i.toString());
                }
            } else {
                expanded.add(strSize);
            }
        } else {
            expanded.add(strSize);
        }
    });
    return Array.from(expanded);
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

                // 사이즈 배열 자동 확장 (예: "225~255" -> ["225", "230", "235", ...])
                if (foundProduct.details?.sizes && foundProduct.details.sizes.length > 0) {
                    foundProduct.details.sizes = expandSizes(foundProduct.details.sizes);
                }

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
            toast.error("구매를 위해 로그인이 필요합니다.");
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
            toast.error("구매를 위해 로그인이 필요합니다.");
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
        const shareTitle = product?.name || 'MONO SHOES';
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
                            {/* 가격 — 모든 사용자에게 오픈 */}
                            <div className="flex items-center gap-2 md:gap-3 pt-2 flex-wrap">
                                {authLoading ? (
                                    <div className="h-5 md:h-6 w-24 md:w-32 bg-gray-100 animate-pulse rounded" />
                                ) : (
                                    <>
                                        <p className="text-base md:text-xl font-semibold text-gray-900">
                                            {formatPrice(product.price)}
                                        </p>
                                        {product.original_price && product.original_price > product.price && (
                                            <p className="text-sm text-gray-400 line-through">
                                                {formatPrice(product.original_price)}
                                            </p>
                                        )}
                                        {(product.discount_percent ?? 0) > 0 && (
                                            <span className="text-sm font-bold text-[#C41E3A]">
                                                -{product.discount_percent}%
                                            </span>
                                        )}
                                        {!user && (
                                            <span className="text-xs text-gray-400 ml-1">
                                                (구매 시 로그인 필요)
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 옵션 선택 영역 — 신발 전용 */}
                        <div className="space-y-6">

                            {/* 색상 선택 */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-black tracking-[0.25em] text-gray-400 uppercase">
                                        COLOR
                                        {selectedColor && (
                                            <span className="ml-2 text-black normal-case font-semibold tracking-normal text-sm">
                                                {selectedColor.name}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {product.details?.colors && product.details.colors.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {product.details.colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => setSelectedColor(color)}
                                                className={`relative px-5 py-2.5 text-[13px] font-medium tracking-wide transition-all duration-200 border
                                                    ${selectedColor?.name === color.name
                                                        ? 'bg-[#4a5544] border-[#4a5544] text-white'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:border-[#4a5544] hover:text-[#4a5544]'
                                                    }`}
                                            >
                                                {color.name.split('#')[0].trim()}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {['블랙', '베이지', '아이보리', '네이비'].map((colorName) => (
                                            <button
                                                key={colorName}
                                                onClick={() => setSelectedColor({ name: colorName, value: colorName })}
                                                className={`px-5 py-2.5 text-[13px] font-medium tracking-wide transition-all duration-200 border
                                                    ${selectedColor?.name === colorName
                                                        ? 'bg-[#4a5544] border-[#4a5544] text-white'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:border-[#4a5544] hover:text-[#4a5544]'
                                                    }`}
                                            >
                                                {colorName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 사이즈 선택 — 신발 전용 */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-black tracking-[0.25em] text-gray-400 uppercase">
                                        SIZE
                                        {selectedSize && (
                                            <span className="ml-2 text-black normal-case font-semibold tracking-normal text-sm">
                                                {selectedSize}mm
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('size-guide-tab');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-[#4a5544] transition-colors tracking-wide"
                                    >
                                        SIZE GUIDE
                                    </button>
                                </div>

                                {product.details?.sizes && product.details.sizes.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {product.details.sizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`w-[72px] h-11 text-[13px] font-semibold tracking-wide transition-all duration-200 border
                                                    ${selectedSize === size
                                                        ? 'bg-[#4a5544] border-[#4a5544] text-white'
                                                        : 'bg-white border-gray-300 text-gray-600 hover:border-[#4a5544] hover:text-[#4a5544]'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {['220', '225', '230', '235', '240', '245', '250', '255', '260'].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`w-[72px] h-11 text-[13px] font-semibold tracking-wide transition-all duration-200 border
                                                    ${selectedSize === size
                                                        ? 'bg-[#4a5544] border-[#4a5544] text-white'
                                                        : 'bg-white border-gray-300 text-gray-600 hover:border-[#4a5544] hover:text-[#4a5544]'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!selectedSize && (
                                    <p className="mt-2 text-[11px] text-amber-600 font-medium tracking-wide">
                                        ※ 사이즈를 선택해주세요
                                    </p>
                                )}
                            </div>

                            {/* 수량 선택 */}
                            <div>
                                <span className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase block mb-3">
                                    수량
                                </span>
                                <div className="flex items-center bg-gray-50 border border-gray-200 w-fit rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-14 text-center text-base font-semibold text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
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

            {/* 탭 네비게이션 */}
            <ProductDetailTabs
                product={product}
                relatedProducts={relatedProducts}
            />

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

            {/* Mobile Bottom Fixed Action Bar - 1열 가로 레이아웃 */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-2 min-[1600px]:hidden safe-area-pb">
                <div className="flex gap-2 items-stretch">
                    {/* 장바구니 - 가로형 */}
                    <Button
                        onClick={handleAddToCart}
                        disabled={!product.is_available}
                        isLoading={isAddingToCart}
                        loadingText="..."
                        className="flex-1 h-12 bg-[#e9e4da] text-gray-900 text-sm font-bold tracking-wider hover:bg-[#ddd8ce] transition-colors uppercase rounded-lg flex items-center justify-center gap-1.5"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {product.is_available ? "장바구니" : "품절"}
                    </Button>

                    {/* 바로구매 - 가로형 */}
                    <Button
                        onClick={handleBuyNow}
                        disabled={!product.is_available}
                        isLoading={isBuyingNow}
                        loadingText="..."
                        className="flex-1 h-12 bg-[#4a5544] text-white text-sm font-bold tracking-wider hover:bg-[#3d4739] transition-colors uppercase rounded-lg flex items-center justify-center gap-1.5"
                    >
                        <CreditCard className="w-4 h-4" />
                        바로구매
                    </Button>

                    {/* 찜하기 - 정사각형 */}
                    <button
                        onClick={handleWishlistClick}
                        className={`w-12 h-12 border-2 flex items-center justify-center transition-colors rounded-lg flex-shrink-0 ${productId && isInWishlist(productId)
                            ? "bg-white border-[#C41E3A]"
                            : "bg-white border-[#C41E3A] hover:bg-gray-50"
                            }`}
                    >
                        <Heart
                            className={`w-6 h-6 transition-colors ${productId && isInWishlist(productId)
                                ? "text-[#C41E3A] fill-[#C41E3A]"
                                : "text-[#C41E3A]"
                                }`}
                            strokeWidth={2}
                        />
                    </button>

                    {/* 공유하기 - 정사각형 */}
                    <button
                        onClick={handleShare}
                        className="w-12 h-12 bg-[#FEE500] border-2 border-[#FEE500] flex items-center justify-center transition-colors rounded-lg hover:bg-[#F5DC00] flex-shrink-0"
                    >
                        <div className="w-7 h-7 bg-[#3C1E1E] rounded-full flex items-center justify-center">
                            <span className="text-xs font-black text-[#FEE500]">카</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Bottom padding for fixed bar on mobile */}
            <div className="h-20 min-[1600px]:hidden" />
        </div>
    );
}

