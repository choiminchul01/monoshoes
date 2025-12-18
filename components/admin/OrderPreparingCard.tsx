"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Save, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";

type OrderItem = {
    id: string;
    product_name: string;
    product_brand: string;
    quantity: number;
    original_quantity: number;
    price: number;
    color?: string;
    size?: string;
    image?: string;
};

type Order = {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_address_detail?: string;
    shipping_postal_code: string;
    final_amount: number;
    total_amount: number;
    shipping_cost: number;
    payment_status: string;
    admin_memo?: string;
    created_at: string;
};

type OrderPreparingCardProps = {
    order: Order;
    onStatusChange: (orderId: string, status: string) => void;
    onTrackingInput: (orderId: string, orderNumber: string) => void;
    onRefresh: () => void;
};

export default function OrderPreparingCard({
    order,
    onStatusChange,
    onTrackingInput,
    onRefresh,
}: OrderPreparingCardProps) {
    const toast = useToast();
    const [isExpanded, setIsExpanded] = useState(false);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [editNote, setEditNote] = useState(""); // 직접 입력 비고

    useEffect(() => {
        if (isExpanded && orderItems.length === 0) {
            fetchOrderItems();
        }
    }, [isExpanded]);

    const fetchOrderItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

        if (!error && data) {
            setOrderItems(data.map(item => ({
                ...item,
                original_quantity: item.quantity
            })));
        } else {
            console.error("Failed to fetch order items:", error);
        }
        setLoading(false);
    };

    const handleQuantityChange = (itemId: string, delta: number) => {
        setOrderItems(prev =>
            prev.map(item => {
                if (item.id === itemId) {
                    const newQty = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
        setHasChanges(true);
    };

    const calculateNewTotal = () => {
        return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const generateChangeLog = () => {
        const changes: string[] = [];
        orderItems.forEach(item => {
            if (item.quantity !== item.original_quantity) {
                changes.push(`${item.product_brand} ${item.product_name}: ${item.original_quantity}→${item.quantity}개`);
            }
        });
        return changes.length > 0 ? changes.join(", ") : null;
    };

    const handleSave = async () => {
        setSaving(true);
        const changeLog = generateChangeLog();

        try {
            for (const item of orderItems) {
                if (item.quantity !== item.original_quantity) {
                    const { error } = await supabase
                        .from("order_items")
                        .update({ quantity: item.quantity })
                        .eq("id", item.id);
                    if (error) throw error;
                }
            }

            // 참고: 수량 0인 상품도 삭제하지 않고 유지 (다시 수량 추가 가능)
            // 발송 시점에 0개 상품은 자동 제외됨

            const newTotal = calculateNewTotal();
            const finalAmount = newTotal + order.shipping_cost;

            const timestamp = new Date().toLocaleString("ko-KR");
            let memoAddition = "";

            if (changeLog || editNote.trim()) {
                memoAddition = `\n[${timestamp}]`;
                if (changeLog) memoAddition += ` ${changeLog}`;
                if (editNote.trim()) memoAddition += ` / 비고: ${editNote.trim()}`;
            }

            const { error: orderError } = await supabase
                .from("orders")
                .update({
                    total_amount: newTotal,
                    final_amount: finalAmount,
                    admin_memo: (order.admin_memo || "") + memoAddition
                })
                .eq("id", order.id);

            if (orderError) throw orderError;

            toast.success("주문이 수정되었습니다.");
            setHasChanges(false);
            setEditNote("");
            onRefresh();
        } catch (error: any) {
            console.error("Save failed:", error);
            toast.error(`저장 실패: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setOrderItems(prev =>
            prev.map(item => ({ ...item, quantity: item.original_quantity }))
        );
        setHasChanges(false);
        setEditNote("");
    };

    // 간략 주문 내용 생성 (브랜드 + 제품명)
    const getOrderSummary = () => {
        if (orderItems.length === 0) return "상품 정보 로딩...";
        return orderItems.map(item =>
            `[${item.product_brand}] ${item.product_name}${item.color ? `(${item.color})` : ""} ${item.quantity}개`
        ).join(" / ");
    };

    // 비고 간략 표시 (최신 메모)
    const getModificationNote = () => {
        if (!order.admin_memo) return "-";
        const lines = order.admin_memo.split("\n").filter(l => l.trim());
        if (lines.length === 0) return "-";
        const lastLine = lines[lines.length - 1];
        return lastLine.length > 30 ? lastLine.substring(0, 30) + "..." : lastLine;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* 1단: 고객 정보 */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">고객명</p>
                        <p className="font-semibold">{order.shipping_name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">연락처</p>
                        <p className="font-medium">{order.shipping_phone}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <p className="text-xs text-gray-500 mb-1">주소</p>
                        <p className="font-medium truncate" title={order.shipping_address}>
                            {order.shipping_address.substring(0, 20)}...
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">상태</p>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            상품준비중
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">주문일</p>
                        <p className="font-medium">{new Date(order.created_at).toLocaleDateString("ko-KR")}</p>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => onTrackingInput(order.id, order.order_number)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            송장입력
                        </button>
                    </div>
                </div>
            </div>

            {/* 2단: 주문 상세 (토글) */}
            <div className="p-4">
                <div
                    className="grid grid-cols-12 gap-2 text-sm cursor-pointer hover:bg-gray-50 -mx-4 -mt-4 p-4 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">주문번호</p>
                        <p className="font-mono text-xs">{order.order_number}</p>
                    </div>
                    <div className="col-span-5">
                        <p className="text-xs text-gray-500 mb-1">제품명 (브랜드 포함)</p>
                        <p className="font-medium text-sm truncate">
                            {isExpanded ? "▲ 접기" : (orderItems.length > 0 ? getOrderSummary() : "▼ 클릭하여 상세 보기")}
                        </p>
                    </div>
                    <div className="col-span-1">
                        <p className="text-xs text-gray-500 mb-1">수량</p>
                        <p className="font-semibold">{orderItems.reduce((sum, i) => sum + i.quantity, 0) || "-"}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">금액</p>
                        <p className="font-semibold text-green-600">{order.final_amount.toLocaleString()}원</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">비고</p>
                        <p className="text-xs text-gray-600 truncate" title={order.admin_memo}>
                            {getModificationNote()}
                        </p>
                    </div>
                </div>

                {/* 확장 영역: 상품별 수량 조절 */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                상품 정보 로딩 중...
                            </div>
                        ) : orderItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                주문 상품이 없습니다.
                            </div>
                        ) : (
                            <>
                                {orderItems.map(item => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border ${item.quantity === 0
                                            ? "bg-red-50 border-red-200"
                                            : item.quantity !== item.original_quantity
                                                ? "bg-yellow-50 border-yellow-200"
                                                : "bg-gray-50 border-gray-200"
                                            }`}
                                    >
                                        {/* 상품 이미지 */}
                                        <div className="flex-shrink-0">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.product_name}
                                                    width={48}
                                                    height={48}
                                                    className="rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                                    No IMG
                                                </div>
                                            )}
                                        </div>

                                        {/* 상품 정보 (브랜드 + 제품명) */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded font-medium">
                                                    {item.product_brand}
                                                </span>
                                                <span className="font-semibold truncate">{item.product_name}</span>
                                            </div>
                                            {(item.color || item.size) && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {item.color && `색상: ${item.color}`}
                                                    {item.color && item.size && " / "}
                                                    {item.size && `사이즈: ${item.size}`}
                                                </p>
                                            )}
                                        </div>

                                        {/* 수량 조절 */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className={`w-8 text-center font-bold text-sm ${item.quantity === 0 ? "text-red-600" : ""
                                                }`}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, 1)}
                                                className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* 금액 */}
                                        <div className="w-20 text-right flex-shrink-0">
                                            <p className={`font-semibold text-sm ${item.quantity === 0 ? "line-through text-gray-400" : ""
                                                }`}>
                                                {(item.price * item.quantity).toLocaleString()}원
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                @{item.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* 비고 직접 입력 */}
                                <div className="pt-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        비고 (수정 사유 직접 입력)
                                    </label>
                                    <input
                                        type="text"
                                        value={editNote}
                                        onChange={(e) => {
                                            setEditNote(e.target.value);
                                            setHasChanges(true);
                                        }}
                                        placeholder="예: 재고 부족, 상품 결함, 고객 요청 등"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                {/* 합계 & 저장 버튼 */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div>
                                        <span className="text-gray-600 mr-2">변경 후 총액:</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {(calculateNewTotal() + order.shipping_cost).toLocaleString()}원
                                        </span>
                                        {hasChanges && (
                                            <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                                                변경사항 있음
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancel}
                                            disabled={!hasChanges}
                                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" />
                                            초기화
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving || !hasChanges}
                                            className="flex items-center gap-1 px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            저장
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
