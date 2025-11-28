"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, Copy, Check } from 'lucide-react';

type Order = {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_name: string;
    shipping_phone: string;
    shipping_postal_code: string;
    shipping_address: string;
    shipping_address_detail: string;
    final_amount: number;
    payment_status: string;
    order_status: string;
    tracking_number?: string;
    shipping_company?: string;
    created_at: string;
};

type OrderItem = {
    id: string;
    product_name: string;
    product_brand: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderId, setOrderId] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        params.then((resolvedParams) => {
            setOrderId(resolvedParams.id);
        });
    }, [params]);

    useEffect(() => {
        if (!authLoading && !user) {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/mypage';
            router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && orderId) {
            fetchOrderDetail();
        }
    }, [user, orderId]);

    const fetchOrderDetail = async () => {
        if (!orderId) return;

        setLoading(true);

        // Fetch order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            console.error('Order fetch error:', orderError);
            setLoading(false);
            return;
        }

        // Check if this order belongs to the current user
        if (orderData.customer_email !== user?.email) {
            router.push('/mypage');
            return;
        }

        setOrder(orderData);

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (!itemsError && itemsData) {
            setOrderItems(itemsData);
        }

        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'shipped': return 'bg-blue-100 text-blue-800';
            case 'delivered': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid': return '입금완료';
            case 'pending': return '입금대기';
            case 'shipped': return '배송중';
            case 'delivered': return '배송완료';
            default: return status;
        }
    };

    const getTrackingUrl = (company: string, trackingNumber: string) => {
        const urls: { [key: string]: string } = {
            'CJ대한통운': `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingNumber}`,
            '우체국택배': `https://service.epost.go.kr/trace.RetrieveRegiPrclDeliv.comm?sid1=${trackingNumber}`,
            '한진택배': `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${trackingNumber}`,
            '롯데택배': `https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=${trackingNumber}`,
        };
        return urls[company] || '#';
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('복사 실패:', err);
        }
    };

    if (authLoading || !user || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">주문을 찾을 수 없습니다.</p>
                    <Link href="/mypage" className="text-black underline">
                        마이페이지로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Button */}
                <Link
                    href="/mypage"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>마이페이지로 돌아가기</span>
                </Link>

                {/* Order Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold">주문 상세</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.payment_status)}`}>
                            {getStatusText(order.payment_status)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">주문번호</p>
                            <p className="font-medium">{order.order_number}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">주문일시</p>
                            <p className="font-medium">
                                {new Date(order.created_at).toLocaleString('ko-KR')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">주문 상품</h2>
                    <div className="space-y-4">
                        {orderItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                                <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{item.product_name}</p>
                                    <p className="text-sm text-gray-500">{item.product_brand}</p>
                                    <p className="text-sm text-gray-500">
                                        {item.color} / {item.size} / 수량: {item.quantity}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{item.price.toLocaleString()} KRW</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="font-bold">총 결제금액</span>
                        <span className="text-2xl font-bold">{order.final_amount.toLocaleString()} KRW</span>
                    </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold mb-4">배송 정보</h2>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-500">받는분</p>
                            <p className="font-medium">{order.shipping_name}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">연락처</p>
                            <p className="font-medium">{order.shipping_phone}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">배송지</p>
                            <p className="font-medium">
                                [{order.shipping_postal_code}] {order.shipping_address}
                                <br />
                                {order.shipping_address_detail}
                            </p>
                        </div>

                        {/* Tracking Information */}
                        {(order.payment_status === 'shipped' || order.payment_status === 'delivered') && order.tracking_number && order.shipping_company && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Truck className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-blue-900">배송 추적</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-blue-700 mb-1">택배사</p>
                                            <p className="font-medium text-blue-900">{order.shipping_company}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-700 mb-1">송장번호</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono font-medium text-blue-900 flex-1">{order.tracking_number}</p>
                                                <button
                                                    onClick={() => copyToClipboard(order.tracking_number!)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-xs font-medium rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    {copied ? (
                                                        <>
                                                            <Check className="w-3 h-3" />
                                                            <span>복사됨</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3 h-3" />
                                                            <span>복사</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <a
                                                href={getTrackingUrl(order.shipping_company, order.tracking_number)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                배송 조회하기
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
