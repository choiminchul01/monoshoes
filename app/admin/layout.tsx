"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Package, ShoppingCart, Users, Settings, Home, Store, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'master@essentia.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/admin-login');
            } else if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
                router.push('/');
            }
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        await supabase.auth.signOut();
        router.push('/admin-login');
    };



    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
    }

    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
        return null;
    }

    const navItems = [
        { href: '/admin', label: '대시보드', icon: Home },
        { href: '/admin/orders', label: '주문 관리', icon: ShoppingCart },
        { href: '/admin/products', label: '상품 관리', icon: Package },
        { href: '/admin/customers', label: '고객 관리', icon: Users },
        { href: '/admin/settings', label: '설정', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
            {/* Mobile Top Bar */}
            <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-50">
                <h1 className="text-xl font-bold text-gray-900">ESSENTIA ADMIN</h1>
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                        <Store className="w-4 h-4" />
                        <span>쇼핑몰</span>
                    </Link>
                    <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="로그아웃">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Mobile Nav Bar (Horizontal Scroll) */}
            <nav className="md:hidden bg-white border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex p-2 gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">ESSENTIA ADMIN</h1>
                    <p className="text-sm text-gray-500 mt-1">관리자 패널</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-black text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-gray-200 space-y-2">
                    <Link href="/" className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full font-medium">
                        <Store className="w-4 h-4" />
                        <span>쇼핑몰로 이동</span>
                    </Link>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>로그아웃</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-auto p-4 md:p-8">
                {children}
            </main>



            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">로그아웃</h3>
                        <p className="text-gray-600 mb-6">정말 로그아웃 하시겠습니까?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
