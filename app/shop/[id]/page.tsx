"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Minus, Plus, ChevronDown, ChevronUp, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter, notFound } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";

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

    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { user } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);
    const [isFlying, setIsFlying] = useState(false);

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

        if (product.details?.colors && product.details.colors.length > 0 && !selectedColor) {
            toast.error("색상을 선택해주세요.");
            return;
        }
        if (product.details?.sizes && product.details.sizes.length > 0 && !selectedSize) {
            toast.error("사이즈를 선택해주세요.");
            return;
        }

        setIsBuyingNow(true);

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

        toast.success("주문 페이지로 이동합니다.");
        router.push("/checkout");
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

    return (
        <div className="container mx-auto px-4 py-12 relative">
            {/* Flying Image Animation */}
            <AnimatePresence>
                {isFlying && product?.images?.[0] && (
                    <motion.div
                        initial={{ position: "fixed", top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1, opacity: 1, zIndex: 100 }}
                        animate={{ top: "40px", left: "calc(100% - 100px)", scale: 0.1, opacity: 0.5 }}
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
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row gap-16">
                {/* Left: Image Gallery */}
                <div className="w-full lg:w-5/12 space-y-4">
                    {/* Main Image with Swipe */}
                    <motion.div
                        className="relative aspect-[3/4] w-full max-h-[50vh] lg:max-h-none bg-gray-50 overflow-hidden mx-auto cursor-grab active:cursor-grabbing"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
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
                                className="object-cover pointer-events-none"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}

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
                                    className={`relative aspect-[3/4] bg-gray-50 overflow-hidden transition-all ${currentImageIndex === index
                                        ? "ring-1 ring-black opacity-100"
                                        : "opacity-70 hover:opacity-100"
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
                                        Color
                                    </span>
                                    <div className="flex flex-wrap gap-3">
                                        {product.details.colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => setSelectedColor(color)}
                                                className={`min-w-[3rem] h-10 px-3 border text-sm font-medium transition-all ${selectedColor?.name === color.name
                                                    ? "border-black bg-black text-white"
                                                    : "border-gray-200 text-gray-900 hover:border-black"
                                                    }`}
                                            >
                                                {color.name.split('#')[0].trim()}
                                            </button>
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
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!product.is_available}
                                    isLoading={isAddingToCart}
                                    loadingText="담는 중..."
                                    className="w-full h-14 bg-black text-white text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase"
                                >
                                    {product.is_available ? "Add to Cart" : "Out of Stock"}
                                </Button>
                            </motion.div>

                            <motion.button
                                whileTap={{ scale: 0.8 }}
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
                            </motion.button>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                                <Button
                                    onClick={handleBuyNow}
                                    disabled={!product.is_available}
                                    isLoading={isBuyingNow}
                                    loadingText="처리 중..."
                                    className="w-full h-14 border border-black bg-white text-black text-sm font-bold tracking-widest hover:bg-gray-50 transition-colors uppercase"
                                >
                                    Buy Now
                                </Button>
                            </motion.div>
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

            {/* Reviews Section */}
            {product && <ReviewSection productId={product.id} />}

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
        </div>
    );
}

function ReviewSection({ productId }: { productId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="mt-24 border-t border-gray-200 pt-16 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 tracking-widest">REVIEWS ({reviews.length})</h3>

            {reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">아직 작성된 리뷰가 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <div className="text-5xl font-bold">{averageRating}</div>
                        <div className="flex flex-col">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? "fill-black text-black" : "text-gray-300"}`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500 mt-1">Based on {reviews.length} reviews</span>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                            {review.author_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium">{review.author_name}</p>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-3 h-3 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{review.content}</p>
                                {review.image_url && (
                                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-100">
                                        <Image src={review.image_url} alt="Review Image" fill className="object-cover" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
