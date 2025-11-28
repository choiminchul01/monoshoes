"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Package, ShoppingBag, AlertCircle, Clock, TrendingUp, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';

type Order = {
    id: string;
    created_at: string;
    final_amount: number;
    payment_status: string;
    shipping_name: string;
    order_number: string;
};

type DailyStats = {
    date: string;
    amount: number;
    label: string;
};

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        todayOrders: 0,
        todayRevenue: 0,
        lowStockCount: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [weeklyRevenue, setWeeklyRevenue] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch All Orders (for total stats)
            const { data: allOrders } = await supabase
                .from('orders')
                .select('payment_status, final_amount, created_at');

            // 2. Fetch Recent Orders (Limit 5)
            const { data: recent } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // 3. Fetch Low Stock Products
            const { data: products } = await supabase
                .from('products')
                .select('stock')
                .lt('stock', 5);

            if (allOrders) {
                const now = new Date();
                const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

                // Calculate Basic Stats
                const totalOrders = allOrders.length;
                const pendingOrders = allOrders.filter(o => o.payment_status === 'pending').length;
                const totalRevenue = allOrders.reduce((sum, o) =>
                    ['paid', 'shipped', 'delivered'].includes(o.payment_status) ? sum + o.final_amount : sum, 0
                );

                const todayOrdersList = allOrders.filter(o => o.created_at.startsWith(todayStr));
                const todayOrders = todayOrdersList.length;
                const todayRevenue = todayOrdersList.reduce((sum, o) =>
                    ['paid', 'shipped', 'delivered'].includes(o.payment_status) ? sum + o.final_amount : sum, 0
                );

                setStats({
                    totalOrders,
                    pendingOrders,
                    totalRevenue,
                    todayOrders,
                    todayRevenue,
                    lowStockCount: products ? products.length : 0
                });

                // Calculate Weekly Revenue (Last 7 Days)
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d;
                });

                const weeklyData = last7Days.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayLabel = date.toLocaleDateString('ko-KR', { weekday: 'short' }); // 월, 화, 수...

                    const dailyAmount = allOrders
                        .filter(o => o.created_at.startsWith(dateStr) && ['paid', 'shipped', 'delivered'].includes(o.payment_status))
                        .reduce((sum, o) => sum + o.final_amount, 0);

                    return { date: dateStr, amount: dailyAmount, label: dayLabel };
                });

                setWeeklyRevenue(weeklyData);
            }

            if (recent) {
                setRecentOrders(recent);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">대시보드 로딩 중...</div>;
    }

    // Find max value for chart scaling
    const maxRevenue = Math.max(...weeklyRevenue.map(d => d.amount), 1); // Avoid division by zero

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">대시보드</h1>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${(stats.pendingOrders + stats.lowStockCount) > 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                    }`}>
                    <AlertCircle className={`w-4 h-4 ${(stats.pendingOrders + stats.lowStockCount) > 0
                        ? 'text-red-600'
                        : 'text-gray-400'
                        }`} />
                    <span className={`text-sm font-bold ${(stats.pendingOrders + stats.lowStockCount) > 0
                        ? 'text-red-700'
                        : 'text-gray-500'
                        }`}>
                        알림 {stats.pendingOrders + stats.lowStockCount}건
                    </span>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">총 매출</h3>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()}원</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-green-600 font-medium flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +{stats.todayRevenue.toLocaleString()}원
                        </span>
                        <span className="text-gray-400">오늘</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">총 주문수</h3>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}건</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-blue-600 font-medium flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +{stats.todayOrders}건
                        </span>
                        <span className="text-gray-400">오늘</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">처리 대기</h3>
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}건</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-yellow-600 font-medium">입금 확인 필요</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart (Left 2/3) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-6">최근 7일 매출 추이</h2>
                    <div className="h-64 flex items-end justify-between gap-2 md:gap-4">
                        {weeklyRevenue.map((day, index) => (
                            <div key={index} className="flex flex-col items-center flex-1 group">
                                <div className="relative w-full flex justify-center items-end h-48 bg-gray-50 rounded-t-lg overflow-hidden group-hover:bg-gray-100 transition-colors">
                                    <div
                                        className="w-full mx-1 md:mx-3 bg-black rounded-t opacity-80 group-hover:opacity-100 transition-all relative"
                                        style={{ height: `${(day.amount / maxRevenue) * 100}%` }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {day.amount.toLocaleString()}원
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 mt-3 font-medium">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Orders (Right 1/3) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold">최근 주문</h2>
                        <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
                            전체보기 <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">주문 내역이 없습니다.</div>
                        ) : (
                            recentOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 border border-gray-200">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{order.shipping_name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{order.order_number}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{order.final_amount.toLocaleString()}원</p>
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                            order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                order.payment_status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {order.payment_status === 'pending' && '입금대기'}
                                            {order.payment_status === 'paid' && '입금완료'}
                                            {order.payment_status === 'shipped' && '배송중'}
                                            {order.payment_status === 'delivered' && '배송완료'}
                                            {order.payment_status === 'cancelled' && '취소'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {stats.lowStockCount > 0 && (
                <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800">재고 부족 알림</h3>
                        <p className="text-sm text-red-600 mt-1">
                            현재 <span className="font-bold">{stats.lowStockCount}</span>개의 상품이 재고가 부족합니다 (5개 미만). 품절되기 전에 재고를 확보하세요.
                        </p>
                        <Link href="/admin/products" className="inline-block mt-2 text-xs font-bold text-red-700 hover:text-red-900 underline">
                            재고 관리하러 가기 &rarr;
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
