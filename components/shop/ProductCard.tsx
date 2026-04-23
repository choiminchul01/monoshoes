import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
    id: string;
    brand: string;
    name: string;
    price: number;
    imageUrl: string;
    aspectRatio?: string;
    originalPrice?: number;
    index?: number;
    discount_percent?: number;
    is_best?: boolean;
    is_new?: boolean;
}

export function ProductCard({
    id, brand, name, price, imageUrl,
    aspectRatio = "aspect-[3/4]",
    originalPrice, index = 0,
    discount_percent = 0, is_best = false, is_new = false
}: ProductCardProps) {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const toast = useToast();
    const router = useRouter();
    const [isFlying, setIsFlying] = useState(false);

    // 할인율 계산 (discount_percent 우선, 없으면 originalPrice로 계산)
    const calcDiscount = discount_percent > 0
        ? discount_percent
        : (originalPrice && originalPrice > price)
            ? Math.round((1 - price / originalPrice) * 100)
            : 0;

    const showOriginalPrice = (originalPrice && originalPrice > price) || calcDiscount > 0;
    const displayOriginalPrice = originalPrice && originalPrice > price ? originalPrice : (calcDiscount > 0 ? Math.round(price / (1 - calcDiscount / 100)) : price);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error("구매를 위해 로그인이 필요합니다.");
            router.push("/login");
            return;
        }

        setIsFlying(true);
        await new Promise(resolve => setTimeout(resolve, 100));

        addToCart({
            id,
            name,
            price,
            image: imageUrl || "/placeholder-product.jpg",
            brand,
            quantity: 1,
        });
    };

    return (
        <>
            <AnimatePresence>
                {isFlying && imageUrl && (
                    <motion.div
                        initial={{ position: "fixed", top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1, opacity: 1, zIndex: 100 }}
                        animate={{ top: "40px", left: "calc(100% - 100px)", scale: 0.1, opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        onAnimationComplete={() => setIsFlying(false)}
                        className="pointer-events-none fixed z-[100]"
                        style={{ top: "50%", left: "50%" }}
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
                whileHover={{ y: -8, scale: 1.02, zIndex: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
            >
                <Link href={`/shop/${id}`} className="block">
                    <div
                        className={`relative ${aspectRatio} w-full overflow-hidden bg-gray-100 rounded-lg transition-all duration-500 group-hover:shadow-2xl select-none`}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={name}
                                draggable={false}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                No Image
                            </div>
                        )}

                        {/* 이미지 보호 오버레이 */}
                        <div className="absolute inset-0 z-[5]" />

                        {/* 배지 영역 */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {is_new && (
                                <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 tracking-wider">
                                    NEW
                                </span>
                            )}
                            {is_best && (
                                <span className="bg-[#D4AF37] text-black text-[9px] font-bold px-2 py-0.5 tracking-wider">
                                    BEST
                                </span>
                            )}
                            {calcDiscount > 0 && (
                                <span className="bg-[#C41E3A] text-white text-[9px] font-bold px-2 py-0.5 tracking-wider">
                                    -{calcDiscount}%
                                </span>
                            )}
                        </div>

                        {/* 빠른 담기 버튼 */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleAddToCart}
                            className="absolute bottom-3 right-3 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white z-10"
                            aria-label="장바구니에 담기"
                        >
                            <ShoppingBag className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {/* 상품 정보 */}
                    <div className="mt-4 space-y-1">
                        <p className="text-xs text-[#C41E3A] uppercase font-bold tracking-wider">{brand}</p>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{name}</h3>
                        {/* 가격 — 모든 사용자에게 오픈 */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            <p className="text-base font-semibold text-gray-900">
                                {formatPrice(price)}
                            </p>
                            {showOriginalPrice && displayOriginalPrice > price && (
                                <p className="text-sm text-gray-400 line-through">
                                    {formatPrice(displayOriginalPrice)}
                                </p>
                            )}
                        </div>
                    </div>
                </Link>
            </motion.div>
        </>
    );
}
