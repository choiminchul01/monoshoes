import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCardProps {
    id: string;
    brand: string;
    name: string;
    price: number;
    imageUrl: string;
    aspectRatio?: string;
    originalPrice?: number;
    index?: number; // For stagger animation
}

export function ProductCard({ id, brand, name, price, imageUrl, aspectRatio = "aspect-[1000/1618]", originalPrice, index = 0 }: ProductCardProps) {
    const { addToCart } = useCart();
    const toast = useToast(); // useToast returns the context directly which has success, error methods
    const [isFlying, setIsFlying] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        setIsFlying(true);

        // UX delay for animation start
        await new Promise(resolve => setTimeout(resolve, 100));

        addToCart({
            id,
            name,
            price,
            image: imageUrl || "/placeholder-product.jpg",
            brand,
            quantity: 1,
        });

        // toast.success("장바구니에 담았습니다"); // Optional: reduce noise if animation is clear
    };

    return (
        <>
            <AnimatePresence>
                {isFlying && imageUrl && (
                    <motion.div
                        initial={{ position: "fixed", top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1, opacity: 1, zIndex: 100 }}
                        // Note: Initial position should ideally be dynamic based on click, but centered is a safe fallback or we can use layoutId
                        // For better UX in list view, we might want to use the card's position, but that requires ref. 
                        // Let's stick to a simple "pop" effect or use fixed positioning from the card if possible.
                        // Actually, let's make it fly from center of screen for visibility, or just use the card's image.
                        // Since getting exact coordinates without ref is hard, let's try a simpler approach:
                        // Render it fixed at the mouse position? No.
                        // Let's render it inside the card but with fixed position logic?
                        // For now, let's use the center-screen pop for visibility as implemented in detail page.
                        // To improve: we could use getBoundingClientRect if we had a ref.
                        animate={{ top: "40px", left: "calc(100% - 100px)", scale: 0.1, opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        onAnimationComplete={() => setIsFlying(false)}
                        className="pointer-events-none fixed z-[100]"
                        style={{ top: "50%", left: "50%" }} // Fallback start
                    >
                        <img
                            src={imageUrl}
                            alt="Flying product"
                            className="w-48 h-64 object-cover rounded-lg shadow-2xl"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.5,
                    delay: index * 0.1, // Stagger delay based on index
                    ease: [0.22, 1, 0.36, 1] // Custom easing
                }}
                className="group relative"
            >
                <Link href={`/shop/${id}`} className="block">
                    <div className={`relative ${aspectRatio} w-full overflow-hidden bg-gray-100`}>
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                No Image
                            </div>
                        )}

                        {/* Quick Add Button - Visible on Hover (Desktop) / Always (Mobile if needed, but usually hover) */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleAddToCart}
                            className="absolute bottom-3 right-3 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white z-10"
                            aria-label="Add to cart"
                        >
                            <ShoppingBag className="w-5 h-5" />
                        </motion.button>
                    </div>
                    <div className="mt-4 space-y-1">
                        <p className="text-xs text-[#C41E3A] uppercase font-bold tracking-wider">{brand}</p>
                        <h3 className="text-sm font-medium text-gray-900">{name}</h3>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">
                                {price.toLocaleString()} KRW
                            </p>
                            {originalPrice && (
                                <p className="text-xs font-normal text-gray-400 line-through">
                                    {originalPrice.toLocaleString()} KRW
                                </p>
                            )}
                        </div>
                    </div>
                </Link>
            </motion.div>
        </>
    );
}
