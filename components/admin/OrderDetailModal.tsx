"use client";

import { useEffect, useState } from "react";
import { X, Package, User, MapPin, CreditCard, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

type OrderItem = {
    product_name: string;
    product_brand: string;
    quantity: number;
    price: number;
    color?: string;
    size?: string;
    image?: string;
};

type OrderDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
};

export default function OrderDetailModal({ isOpen, onClose, orderId }: OrderDetailModalProps) {
    const [order, setOrder] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails();
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async () => {
        setLoading(true);

        // 주문 정보 가져오기
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (orderError) {
            console.error("Failed to fetch order:", orderError);
            setLoading(false);
            return;
        }

        // 주문 아이템 가져오기
        const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", orderId);

        if (itemsError) {
            console.error("Failed to fetch order items:", itemsError);
        }

        setOrder(orderData);
        setOrderItems(itemsData || []);
        setLoading(false);
    };

    if (!isOpen) return null;

    const getTrackingUrl = (company: string, number: string) => {
        const urls: { [key: string]: string } = {
            "CJ대한통운": `https://trace.cjlogistics.com/web/detail.jsp?slipno=${number}`,
            "우체국택배": `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${number}`,
            "한진택배": `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${number}`,
            "롯데택배": `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${number}`,
            "로젠택배": `https://www.ilogen.com/web/personal/trace/${number}`,
        };
        return urls[company] || "#";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">주문 상세</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">로딩 중...</div>
                ) : order ? (
                    <div className="p-6 space-y-6">
                        {/* 주문 기본 정보 */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold mb-2">주문번호: {order.order_number}</h3>
                                    <p className="text-sm text-gray-600">
                                        주문일시: {new Date(order.created_at).toLocaleString("ko-KR")}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <span
                                        className={`px-3 py-1 text-sm font-semibold rounded-full ${order.payment_status === "paid"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                                    >
                                        {order.payment_status === "pending" && "입금대기"}
                                        {order.payment_status === "paid" && "입금완료"}
                                        {order.payment_status === "shipped" && "배송중"}
                                        {order.payment_status === "delivered" && "배송완료"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 주문 상품 */}
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                                <Package className="w-5 h-5" />
                                주문 상품
                            </h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {orderItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-4 p-4 border-b border-gray-200 last:border-b-0"
                                    >
                                        {item.image && (
                                            <Image
                                                src={item.image}
                                                alt={item.product_name}
                                                width={80}
                                                height={80}
                                                className="rounded object-cover"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold">{item.product_name}</p>
                                            <p className="text-sm text-gray-600">{item.product_brand}</p>
                                            {(item.color || item.size) && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {item.color && `색상: ${item.color}`}
                                                    {item.color && item.size && " / "}
                                                    {item.size && `사이즈: ${item.size}`}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{item.price.toLocaleString()}원</p>
                                            <p className="text-sm text-gray-600">수량: {item.quantity}개</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 주문자 정보 */}
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                                <User className="w-5 h-5" />
                                주문자 정보
                            </h3>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">이름</p>
                                    <p className="font-semibold">{order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">연락처</p>
                                    <p className="font-semibold">{order.customer_phone}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-600">이메일</p>
                                    <p className="font-semibold">{order.customer_email}</p>
                                </div>
                            </div>
                        </div>

                        {/* 배송지 정보 */}
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                                <MapPin className="w-5 h-5" />
                                배송지 정보
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div>
                                    <p className="text-sm text-gray-600">받는분</p>
                                    <p className="font-semibold">{order.shipping_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">연락처</p>
                                    <p className="font-semibold">{order.shipping_phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">주소</p>
                                    <p className="font-semibold">
                                        ({order.shipping_postal_code}) {order.shipping_address}
                                    </p>
                                    {order.shipping_address_detail && (
                                        <p className="text-gray-700">{order.shipping_address_detail}</p>
                                    )}
                                </div>
                                {order.shipping_memo && (
                                    <div>
                                        <p className="text-sm text-gray-600">배송 메모</p>
                                        <p className="text-gray-700">{order.shipping_memo}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 배송 정보 */}
                        {(order.tracking_number || order.shipping_company) && (
                            <div>
                                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                                    <Package className="w-5 h-5" />
                                    배송 정보
                                </h3>
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                                    {order.shipping_company && (
                                        <div>
                                            <p className="text-sm text-blue-600">택배사</p>
                                            <p className="font-semibold text-blue-900">{order.shipping_company}</p>
                                        </div>
                                    )}
                                    {order.tracking_number && (
                                        <div>
                                            <p className="text-sm text-blue-600">송장번호</p>
                                            <p className="font-semibold text-blue-900">{order.tracking_number}</p>
                                            {order.shipping_company && order.shipping_company !== "기타" && (
                                                <a
                                                    href={getTrackingUrl(order.shipping_company, order.tracking_number)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    배송 조회하기 →
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 결제 정보 */}
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                                <CreditCard className="w-5 h-5" />
                                결제 정보
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">상품 금액</span>
                                    <span className="font-semibold">{order.total_amount.toLocaleString()}원</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">할인 금액</span>
                                        <span className="text-red-600">
                                            -{order.discount_amount.toLocaleString()}원
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">배송비</span>
                                    <span className="font-semibold">{order.shipping_cost.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-300">
                                    <span className="text-lg font-bold">최종 결제 금액</span>
                                    <span className="text-lg font-bold text-green-600">
                                        {order.final_amount.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 관리자 메모 */}
                        {order.admin_memo && (
                            <div>
                                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                                    <FileText className="w-5 h-5" />
                                    관리자 메모
                                </h3>
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <p className="text-gray-700 whitespace-pre-wrap">{order.admin_memo}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">주문 정보를 불러올 수 없습니다</div>
                )}

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
