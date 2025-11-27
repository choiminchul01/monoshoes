"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    const toast = useToast();
    const shippingCost = cartTotal > 500000 ? 0 : 3000;
    const finalTotal = cartTotal + shippingCost;

    const handleRemove = (id: string, color?: string, size?: string) => {
        removeFromCart(id, color || "", size || "");
        toast.info("상품이 장바구니에서 삭제되었습니다.");
    };

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-32 text-center">
                <h1 className="text-2xl font-bold mb-4">YOUR CART IS EMPTY</h1>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <Link
                    href="/shop"
                    className="inline-block bg-black text-white px-8 py-4 text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase"
                >
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold tracking-widest mb-12 text-center">SHOPPING CART</h1>

            <div className="flex flex-col lg:flex-row gap-12">
                {/* Cart Items */}
                <div className="w-full lg:w-2/3">
                    <div className="space-y-8">
                        {cartItems.map((item) => (
                            <div
                                key={`${item.id}-${item.color}-${item.size}`}
                                className="flex gap-6 border-b border-gray-100 pb-8"
                            >
                                {/* Image */}
                                <div className="relative w-24 h-32 bg-gray-50 flex-shrink-0">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-1">
                                                    {item.brand}
                                                </h3>
                                                <h2 className="text-lg font-medium text-gray-900">
                                                    {item.name}
                                                </h2>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.id, item.color, item.size)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="mt-2 text-sm text-gray-500 space-y-1">
                                            <p>Color: {item.color}</p>
                                            <p>Size: {item.size}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center border border-gray-200">
                                            <button
                                                onClick={() =>
                                                    updateQuantity(item.id, item.quantity - 1, item.color, item.size)
                                                }
                                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-12 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    updateQuantity(item.id, item.quantity + 1, item.color, item.size)
                                                }
                                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">
                                            {(item.price * item.quantity).toLocaleString()} KRW
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-gray-50 p-8 sticky top-24">
                        <h2 className="text-lg font-bold tracking-widest mb-6">ORDER SUMMARY</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{cartTotal.toLocaleString()} KRW</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium">
                                    {shippingCost === 0 ? "Free" : `${shippingCost.toLocaleString()} KRW`}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {finalTotal.toLocaleString()} KRW
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/checkout"
                            className="block w-full h-14 bg-black text-white text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase flex items-center justify-center"
                        >
                            Checkout
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
