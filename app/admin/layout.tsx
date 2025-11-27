"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Package, ShoppingCart, Users, Settings, Home } from 'lucide-react';

const ADMIN_EMAIL = 'master@essentia.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/admin-login');
            } else if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
                router.push('/');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
    }

    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold">ADMIN</h1>
                    <p className="text-sm text-gray-500 mt-1">관리자 패널</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Home className="w-5 h-5" />
                        <span>대시보드</span>
                    </Link>
                    <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <ShoppingCart className="w-5 h-5" />
                        <span>주문 관리</span>
                    </Link>
                    <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Package className="w-5 h-5" />
                        <span>상품 관리</span>
                    </Link>
                    <Link href="/admin/customers" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Users className="w-5 h-5" />
                        <span>고객 관리</span>
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Settings className="w-5 h-5" />
                        <span>설정</span>
                    </Link>
                </nav>
                <div className="p-4 border-t border-gray-200">
                    <Link href="/" className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors text-center">
                        ← 쇼핑몰로 돌아가기
                    </Link>
                </div>
            </aside>
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
