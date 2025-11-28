"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Package, ShoppingBag, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        todayOrders: 0,
        todayRevenue: 0,
        lowStockCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);

            // Fetch Orders
            const { data: orders } = await supabase
                .from('orders')
                .select('payment_status, final_amount, created_at');

            // Fetch Products for Low Stock
            const { data: products } = await supabase
                .from('products')
                .select('stock')
                .lt('stock', 5); // Stock less than 5

            if (orders) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

                const totalOrders = orders.length;
                const pendingOrders = orders.filter(o => o.payment_status === 'pending').length;
                const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'paid' || o.payment_status === 'shipped' || o.payment_status === 'delivered' ? o.final_amount : 0), 0);

                const todayOrdersList = orders.filter(o => o.created_at >= today);
                const todayOrders = todayOrdersList.length;
                const todayRevenue = todayOrdersList.reduce((sum, o) => sum + (o.payment_status === 'paid' || o.payment_status === 'shipped' || o.payment_status === 'delivered' ? o.final_amount : 0), 0);

                const lowStockCount = products ? products.length : 0;

                setStats({
                    totalOrders,
                    pendingOrders,
                    totalRevenue,
                    todayOrders,
                    todayRevenue,
                    lowStockCount
                });
            }
            setLoading(false);
        }
        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">로딩 중...</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">대시보드</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">총 매출 (결제완료)</h3>
                        <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} KRW</p>
                    <p className="text-sm text-gray-500 mt-1">
                        오늘: +{stats.todayRevenue.toLocaleString()} KRW
                    </p>
                </div>

                {/* Orders Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">총 주문</h3>
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totalOrders}건</p>
                    <p className="text-sm text-gray-500 mt-1">
                        오늘: +{stats.todayOrders}건
                    </p>
                </div>

                {/* Pending Orders Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">입금 대기</h3>
                        <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}건</p>
                    <p className="text-sm text-gray-500 mt-1">
                        확인 필요
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">빠른 작업</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/admin/orders"
                            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-all text-center group"
                        >
                            <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-black transition-colors" />
                            <p className="font-medium">주문 관리</p>
                        </Link>
                        <Link
                            href="/admin/products"
                            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-all text-center group"
                        >
                            <Package className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-black transition-colors" />
                            <p className="font-medium">상품 관리</p>
                        </Link>
                    </div>
                </div>

                {/* Alerts */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">알림</h2>
                    <div className="space-y-4">
                        {stats.lowStockCount > 0 ? (
                            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">재고 부족 상품</p>
                                    <p className="text-sm mt-1">
                                        {stats.lowStockCount}개의 상품이 재고가 부족합니다 (5개 미만).
                                    </p>
                                    <Link href="/admin/products" className="text-sm underline mt-2 inline-block hover:text-red-900">
                                        확인하기
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 text-center py-4">
                                새로운 알림이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
