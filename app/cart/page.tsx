"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        toggleItemSelection,
        selectAll,
        deselectAll
    } = useCart();

    const toast = useToast();
    // Calculate totals
    const cartTotal = cartItems.reduce((total, item) => item.selected ? total + item.price * item.quantity : total, 0);
    const shippingCost = 0;
    const finalTotal = cartTotal + shippingCost;

    const handleRemove = (id: string, color?: string, size?: string) => {
        removeFromCart(id, color || "", size || "");
        toast.info("상품이 장바구니에서 삭제되었습니다.");
    };

    const allSelected = cartItems.length > 0 && cartItems.every(item => item.selected);

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
                    {/* Select All & Delete All Controls */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <button
                            onClick={allSelected ? deselectAll : selectAll}
                            className="flex items-center gap-2 text-sm font-medium hover:text-gray-600 transition-colors"
                        >
                            {allSelected ? (
                                <CheckSquare className="w-5 h-5" />
                            ) : (
                                <Square className="w-5 h-5" />
                            )}
                            전체 선택 ({cartItems.filter(i => i.selected).length}/{cartItems.length})
                        </button>

                        <button
                            onClick={() => {
                                if (window.confirm("장바구니의 모든 상품을 삭제하시겠습니까?")) {
                                    clearCart();
                                }
                            }}
                            className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors border border-gray-300 rounded px-3 py-1.5 hover:border-red-200 hover:bg-red-50"
                        >
                            전체 삭제
                        </button>
                    </div>

                    <div className="space-y-8">
                        {cartItems.map((item) => (
                            <div
                                key={`${item.id}-${item.color}-${item.size}`}
                                className={`flex gap-6 border-b border-gray-100 pb-8 transition-opacity ${!item.selected ? 'opacity-50' : ''}`}
                            >
                                {/* Checkbox */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => toggleItemSelection(item.id, item.color, item.size)}
                                    >
                                        {item.selected ? (
                                            <CheckSquare className="w-5 h-5" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>

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
                                            {formatPrice(item.price * item.quantity)}
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
                                <span className="font-medium">{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium">
                                    Free
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-base font-bold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {formatPrice(finalTotal)}
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/checkout"
                            className={`block w-full h-14 bg-black text-white text-sm font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase flex items-center justify-center ${cartTotal === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            결제하기
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
