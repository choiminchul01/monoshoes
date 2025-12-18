"use client";

import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2, AlertTriangle, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";

type OrderItem = {
    id: string;
    product_name: string;
    product_brand: string;
    quantity: number;
    price: number;
    color?: string;
    size?: string;
    image?: string;
};

type OrderEditModalProps = {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderNumber: string;
    onSuccess: () => void;
};

export default function OrderEditModal({
    isOpen,
    onClose,
    orderId,
    orderNumber,
    onSuccess,
}: OrderEditModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [originalItems, setOriginalItems] = useState<OrderItem[]>([]);
    const [editReason, setEditReason] = useState("");
    const [shippingCost, setShippingCost] = useState(0);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderItems();
        }
    }, [isOpen, orderId]);

    const fetchOrderItems = async () => {
        setLoading(true);

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", orderId);

        // Fetch order for shipping cost
        const { data: orderData } = await supabase
            .from("orders")
            .select("shipping_cost")
            .eq("id", orderId)
            .single();

        if (itemsError) {
            console.error("Failed to fetch order items:", itemsError);
            toast.error("주문 상품을 불러오는데 실패했습니다.");
        } else {
            const items = itemsData || [];
            setOrderItems(items);
            setOriginalItems(JSON.parse(JSON.stringify(items))); // Deep copy
            setShippingCost(orderData?.shipping_cost || 0);
        }
        setLoading(false);
    };

    const handleQuantityChange = (itemId: string, delta: number) => {
        setOrderItems((prev) =>
            prev.map((item) => {
                if (item.id === itemId) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const handlePriceChange = (itemId: string, newPrice: number) => {
        setOrderItems((prev) =>
            prev.map((item) => {
                if (item.id === itemId) {
                    return { ...item, price: Math.max(0, newPrice) };
                }
                return item;
            })
        );
    };

    const handleRemoveItem = (itemId: string) => {
        if (orderItems.length <= 1) {
            toast.warning("최소 1개 이상의 상품이 필요합니다.");
            return;
        }
        setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const hasChanges = () => {
        if (orderItems.length !== originalItems.length) return true;
        return orderItems.some((item) => {
            const original = originalItems.find((o) => o.id === item.id);
            if (!original) return true;
            return item.quantity !== original.quantity || item.price !== original.price;
        });
    };

    const generateChangeLog = () => {
        const changes: string[] = [];
        const timestamp = new Date().toLocaleString("ko-KR");

        orderItems.forEach((item) => {
            const original = originalItems.find((o) => o.id === item.id);
            if (!original) return;

            if (item.quantity !== original.quantity) {
                changes.push(`[수량변경] ${item.product_name}: ${original.quantity}개 → ${item.quantity}개`);
            }
            if (item.price !== original.price) {
                changes.push(`[가격변경] ${item.product_name}: ${original.price.toLocaleString()}원 → ${item.price.toLocaleString()}원`);
            }
        });

        // Removed items
        originalItems.forEach((original) => {
            if (!orderItems.find((item) => item.id === original.id)) {
                changes.push(`[상품삭제] ${original.product_name}`);
            }
        });

        if (changes.length === 0) return "";

        return `\n\n--- 주문 수정 (${timestamp}) ---\n사유: ${editReason}\n${changes.join("\n")}`;
    };

    const handleSave = async () => {
        if (!editReason.trim()) {
            toast.warning("수정 사유를 입력해주세요.");
            return;
        }

        if (!hasChanges()) {
            toast.info("변경된 내용이 없습니다.");
            return;
        }

        setSaving(true);

        try {
            // Update each order item
            for (const item of orderItems) {
                const { error } = await supabase
                    .from("order_items")
                    .update({
                        quantity: item.quantity,
                        price: item.price,
                    })
                    .eq("id", item.id);

                if (error) throw error;
            }

            // Delete removed items
            const removedItemIds = originalItems
                .filter((original) => !orderItems.find((item) => item.id === original.id))
                .map((item) => item.id);

            if (removedItemIds.length > 0) {
                const { error } = await supabase
                    .from("order_items")
                    .delete()
                    .in("id", removedItemIds);

                if (error) throw error;
            }

            // Update order totals and admin memo
            const newTotal = calculateTotal();
            const finalAmount = newTotal + shippingCost;

            const { data: currentOrder } = await supabase
                .from("orders")
                .select("admin_memo")
                .eq("id", orderId)
                .single();

            const changeLog = generateChangeLog();
            const updatedMemo = (currentOrder?.admin_memo || "") + changeLog;

            const { error: orderError } = await supabase
                .from("orders")
                .update({
                    total_amount: newTotal,
                    final_amount: finalAmount,
                    admin_memo: updatedMemo,
                })
                .eq("id", orderId);

            if (orderError) throw orderError;

            toast.success("주문이 수정되었습니다.");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("주문 수정 실패:", error);
            toast.error(`주문 수정 실패: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const totalAmount = calculateTotal();
    const finalAmount = totalAmount + shippingCost;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#001E10] to-[#000000] opacity-95" />

            {/* Brand Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <h1
                    className="text-[15vw] font-bold text-[#D4AF37] opacity-10 select-none whitespace-nowrap tracking-widest"
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                    ESSENTIA
                </h1>
            </div>

            <div className="relative z-10 bg-[#FDFCF5] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#D4AF37]/30 shadow-xl">
                {/* Header */}
                <div className="sticky top-0 bg-[#FDFCF5] border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">주문 수정</h2>
                        <p className="text-sm text-gray-500">주문번호: {orderNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">로딩 중...</div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Warning */}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-semibold">검수 중 수정</p>
                                <p>상품 이슈 발생 시 수량, 가격을 조정하거나 상품을 제거할 수 있습니다.</p>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900">주문 상품</h3>
                            {orderItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white"
                                >
                                    {/* Product Info */}
                                    <div className="flex gap-4">
                                        {item.image && (
                                            <Image
                                                src={item.image}
                                                alt={item.product_name}
                                                width={60}
                                                height={60}
                                                className="rounded object-cover"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{item.product_name}</p>
                                            <p className="text-sm text-gray-500">{item.product_brand}</p>
                                            {(item.color || item.size) && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {item.color && `색상: ${item.color}`}
                                                    {item.color && item.size && " / "}
                                                    {item.size && `사이즈: ${item.size}`}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="상품 제거"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Quantity & Price Editors */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Quantity */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, -1)}
                                                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, 1)}
                                                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">개당 가격</label>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handlePriceChange(item.id, parseInt(e.target.value) || 0)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                                />
                                                <span className="text-sm text-gray-500">원</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Item Subtotal */}
                                    <div className="text-right text-sm">
                                        <span className="text-gray-500">소계: </span>
                                        <span className="font-semibold">{(item.price * item.quantity).toLocaleString()}원</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">상품 합계</span>
                                <span className="font-semibold">{totalAmount.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">배송비</span>
                                <span>{shippingCost.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                                <span className="font-bold">최종 금액</span>
                                <span className="font-bold text-[#00704A]">{finalAmount.toLocaleString()}원</span>
                            </div>
                        </div>

                        {/* Edit Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                수정 사유 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={editReason}
                                onChange={(e) => setEditReason(e.target.value)}
                                placeholder="예: 재고 부족으로 수량 조정, 상품 결함으로 제외 등"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="sticky bottom-0 bg-[#FDFCF5] border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#00704A] text-white rounded-lg hover:bg-[#005A3C] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
