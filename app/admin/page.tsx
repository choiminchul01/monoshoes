"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
    });

    useEffect(() => {
        async function fetchStats() {
            const { data: orders } = await supabase
                .from('orders')
                .select('payment_status, final_amount');

            if (orders) {
                const totalOrders = orders.length;
                const pendingOrders = orders.filter(o => o.payment_status === 'pending').length;
                const totalRevenue = orders.reduce((sum, o) => sum + o.final_amount, 0);

                setStats({ totalOrders, pendingOrders, totalRevenue });
            }
        }
        fetchStats();
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">대시보드</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">총 주문</h3>
                    <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">입금 대기</h3>
                    <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.pendingOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">총 매출</h3>
                    <p className="text-3xl font-bold mt-2">{stats.totalRevenue.toLocaleString()} KRW</p>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-4">빠른 작업</h2>
                <div className="grid grid-cols-2 gap-4">
                    <a
                        href="/admin/orders"
                        className="p-4 border border-gray-200 rounded-lg hover:border-black transition-colors text-center"
                    >
                        <p className="font-medium">주문 관리</p>
                    </a>
                    <a
                        href="/admin/products"
                        className="p-4 border border-gray-200 rounded-lg hover:border-black transition-colors text-center"
                    >
                        <p className="font-medium">상품 관리</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
