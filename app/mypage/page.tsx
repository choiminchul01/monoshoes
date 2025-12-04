"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Package, ChevronRight, Heart, HelpCircle } from 'lucide-react';

type Order = {
    id: string;
    order_number: string;
    final_amount: number;
    payment_status: string;
    order_status: string;
    created_at: string;
};

export default function MyPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { wishlist } = useWishlist();
    const [orders, setOrders] = useState<Order[]>([]);
    const [inquiryCount, setInquiryCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirectTo=/mypage');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchOrders();
            fetchInquiryCount();
        }
    }, [user]);

    const fetchOrders = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_email', user.email)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const fetchInquiryCount = async () => {
        if (!user) return;

        // Fetch count from both tables
        const [generalRes, productRes] = await Promise.all([
            supabase.from('general_qna').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('product_qna').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        ]);

        const total = (generalRes.count || 0) + (productRes.count || 0);
        setInquiryCount(total);
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

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Page</h1>
                    <p className="text-gray-600">{user.email}</p>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Link
                        href="/mypage/wishlist"
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold mb-1">찜한 상품</h3>
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold">{wishlist.length}</span>개의 상품
                                </p>
                            </div>
                            <Heart className="w-5 h-5 text-[#C41E3A] fill-[#C41E3A]" />
                        </div>
                    </Link>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold mb-1">주문 내역</h3>
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold">{orders.length}</span>개의 주문
                                </p>
                            </div>
                            <Package className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <Link
                        href="/mypage/inquiries"
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold mb-1">나의 문의내역</h3>
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold">{inquiryCount}</span>건의 문의
                                </p>
                            </div>
                            <HelpCircle className="w-5 h-5 text-blue-500" />
                        </div>
                    </Link>
                </div>

                {/* Orders Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold">주문 내역</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-gray-500">
                            주문 내역을 불러오는 중...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-600 mb-6">아직 주문 내역이 없습니다.</p>
                            <Link
                                href="/shop"
                                className="inline-block px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                쇼핑하러 가기
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {orders.map((order) => (
                                <Link
                                    key={order.id}
                                    href={`/mypage/orders/${order.id}`}
                                    className="block p-6 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {order.order_number}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                                                    {getStatusText(order.payment_status)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-lg font-bold text-gray-900 mt-2">
                                                {order.final_amount.toLocaleString()} KRW
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Account Info Section */}
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold mb-4">계정 정보</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">이메일</p>
                            <p className="text-base font-medium">{user.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">이름</p>
                            <p className="text-base font-medium">{user.user_metadata?.full_name || 'Not set'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
