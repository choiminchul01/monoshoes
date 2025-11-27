"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function OrdersCheckPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            product_name,
                            quantity,
                            price
                        )
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, []);

    if (loading) return <div className="p-8">Loading orders...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">주문 내역 확인 (DB 데이터)</h1>

            {orders.length === 0 ? (
                <p>주문 내역이 없습니다.</p>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-6 shadow-sm bg-white">
                            <div className="flex justify-between items-start mb-4 border-b pb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-600">{order.order_number}</h2>
                                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {order.payment_status}
                                    </span>
                                    <p className="font-bold mt-1">{order.final_amount.toLocaleString()}원</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2 text-gray-700">주문자 정보</h3>
                                    <p><span className="text-gray-500 w-20 inline-block">이름:</span> {order.customer_name}</p>
                                    <p><span className="text-gray-500 w-20 inline-block">이메일:</span> {order.customer_email}</p>
                                    <p><span className="text-gray-500 w-20 inline-block">연락처:</span> {order.customer_phone}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2 text-gray-700">배송 정보</h3>
                                    <p><span className="text-gray-500 w-20 inline-block">받는분:</span> {order.shipping_name}</p>
                                    <p><span className="text-gray-500 w-20 inline-block">주소:</span> ({order.shipping_postal_code}) {order.shipping_address} {order.shipping_address_detail}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-semibold mb-2 text-gray-700">주문 상품 ({order.order_items.length})</h3>
                                <div className="bg-gray-50 rounded p-4 space-y-2">
                                    {order.order_items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.product_name} x {item.quantity}</span>
                                            <span>{item.price.toLocaleString()}원</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
