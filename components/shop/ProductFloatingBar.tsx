"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ShoppingBag, Heart, Share2 } from "lucide-react";

interface ProductFloatingBarProps {
    product: any;
    isAddingToCart: boolean;
    isBuyingNow: boolean;
    isInWishlist: boolean;
    onAddToCart: () => void;
    onBuyNow: () => void;
    onWishlist: () => void;
    onShare: () => void;
}

export default function ProductFloatingBar({
    product,
    isAddingToCart,
    isBuyingNow,
    isInWishlist,
    onAddToCart,
    onBuyNow,
    onWishlist,
    onShare,
}: ProductFloatingBarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const guideSection = document.getElementById("guide-section");
            if (!guideSection) return;

            // Trigger when the Guide Section touches the top area (approx header height 100px)
            const rect = guideSection.getBoundingClientRect();
            const isPastGuide = rect.top <= 120;

            // Hide when near bottom (footer area)
            const distanceToBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
            // Hide if closer than 600px from bottom
            const isNearBottom = distanceToBottom < 600;

            setIsVisible(isPastGuide && !isNearBottom);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    // Wing Banner: Fixed to the right of content (ml-[530px] from center)
                    // Visible only on screens >= 1600px (3xl equivalent)
                    className="fixed left-1/2 top-1/2 -translate-y-1/2 ml-[530px] z-[9999] hidden min-[1600px]:block"
                >
                    <div className="w-[280px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

                        {/* Product Thumbnail & Info */}
                        <div className="p-4 border-b border-gray-100">
                            {product.images?.[0] && (
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                                    <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                                </div>
                            )}
                            <p className="text-xs font-bold text-[#C41E3A] mb-1">{product.brand}</p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed">
                                {product.name}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="p-3 space-y-2 bg-gray-50/50">
                            <div className="grid grid-cols-2 gap-2">
                                {/* Wishlist */}
                                <button
                                    onClick={onWishlist}
                                    className={`flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold border transition-all ${isInWishlist
                                        ? "bg-red-50 border-red-100 text-[#C41E3A]"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <Heart className={`w-3.5 h-3.5 ${isInWishlist ? "fill-current" : ""}`} />
                                    찜하기
                                </button>

                                {/* Share */}
                                <button
                                    onClick={onShare}
                                    className="flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    공유
                                </button>
                            </div>

                            {/* Cart */}
                            <button
                                onClick={onAddToCart}
                                disabled={!product.is_available || isAddingToCart}
                                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#e9e4da] hover:bg-[#ddd8ce] text-gray-900 text-sm font-bold transition-all"
                            >
                                {isAddingToCart ? (
                                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <ShoppingCart className="w-4 h-4" />
                                )}
                                장바구니 담기
                            </button>

                            {/* Buy Now */}
                            <button
                                onClick={onBuyNow}
                                disabled={!product.is_available || isBuyingNow}
                                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#4a5544] hover:bg-[#3d4739] text-white text-sm font-bold shadow-lg transition-all"
                            >
                                {isBuyingNow ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <ShoppingBag className="w-4 h-4" />
                                )}
                                바로 구매하기
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
