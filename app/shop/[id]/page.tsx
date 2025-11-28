"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Minus, Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getColorHex } from "@/lib/colorUtils";
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
    const [isFlying, setIsFlying] = useState(false);

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
        await new Promise(resolve => setTimeout(resolve, 800)); // Wait for animation

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

    // ... (existing handleBuyNow and handleWishlistClick)

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
                {/* ... (existing Image Gallery) */}
                <div className="w-full lg:w-5/12 space-y-4">
                    {/* ... (existing image code) */}
                    <motion.div
                        className="relative aspect-[3/4] w-full max-h-[50vh] lg:max-h-none bg-gray-50 overflow-hidden mx-auto cursor-grab active:cursor-grabbing"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            // ... (existing drag logic)
                        }}
                    >
                        {/* ... (existing image render) */}
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
                        {/* ... (existing dots) */}
                    </motion.div>
                    {/* ... (existing thumbnails) */}
                </div>

                {/* Right: Product Info */}
                <div className="w-full lg:w-7/12 lg:sticky lg:top-24 h-fit">
                    <div className="space-y-8">
                        {/* ... (existing header, description, options) */}

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

                        {/* ... (existing accordions) */}
                    </div>
                </div>
            </div>
            {/* ... (existing related products) */}
        </div>

                        {/* Accordions */ }
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
                    </div >
                </div >
            </div >

        {/* Related Products */ }
    {
        relatedProducts.length > 0 && (
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
        )
    }
        </div >
    );
}
