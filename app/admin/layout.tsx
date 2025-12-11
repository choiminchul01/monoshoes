"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Package, ShoppingCart, Users, Settings, Home, Store, LogOut, MessageSquare, HelpCircle, FileText, Shield, Ticket, ClipboardCheck, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ToastProvider } from '@/context/ToastContext';
import { useAdminPermissions } from '@/lib/useAdminPermissions';

// Admin validation now uses admin_roles table via useAdminPermissions hook

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const { hasPermission, isMaster, loading: permLoading } = useAdminPermissions();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showShopConfirm, setShowShopConfirm] = useState(false);
    const [counts, setCounts] = useState({ orders: 0, products: 0 });

    useEffect(() => {
        if (!loading && !permLoading) {
            if (!user) {
                router.push('/admin-login');
            } else if (!hasPermission('dashboard')) {
                // User is logged in but not an admin
                router.push('/');
            } else {
                fetchNotificationCounts();
            }
        }
    }, [user, loading, permLoading, hasPermission, router]);

    const fetchNotificationCounts = async () => {
        try {
            // Pending Orders
            const { count: pendingOrders } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('payment_status', 'pending');

            // Low Stock Products
            const { count: lowStock } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .lt('stock', 5);

            setCounts({
                orders: pendingOrders || 0,
                products: lowStock || 0
            });
        } catch (error) {
            console.error("Error fetching notification counts:", error);
        }
    };

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        await supabase.auth.signOut();
        router.push('/admin-login');
    };

    const handleGoToShop = () => {
        setShowShopConfirm(false);
        router.push('/shop');
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
    }

    if (!user || permLoading || !hasPermission('dashboard')) {
        return null;
    }

    // All possible nav items with permission keys (grouped by management workflow)
    const allNavItems = [
        { href: '/admin', label: '대시보드', icon: Home, badge: 0, permission: 'dashboard' as const },
        { href: '/admin/orders', label: '주문 관리', icon: ShoppingCart, badge: counts.orders, permission: 'orders' as const },
        { href: '/admin/reviews', label: '리뷰 관리', icon: MessageSquare, badge: 0, permission: 'reviews' as const },
        { href: '/admin/products', label: '상품 관리', icon: Package, badge: counts.products, permission: 'products' as const },
        { href: '/admin/inspections', label: '출고관리', icon: ClipboardCheck, badge: 0, permission: 'products' as const },
        { href: '/admin/coupons', label: '쿠폰 관리', icon: Ticket, badge: 0, permission: 'coupons' as const },
        { href: '/admin/customers', label: '고객 관리', icon: Users, badge: 0, permission: 'customers' as const },
        { href: '/admin/inquiries', label: '문의 관리', icon: HelpCircle, badge: 0, permission: 'inquiries' as const },
        { href: '/admin/board', label: '게시판 관리', icon: FileText, badge: 0, permission: 'board' as const },
        { href: '/admin/events', label: '이벤트 관리', icon: Megaphone, badge: 0, permission: 'board' as const },
        { href: '/admin/settings', label: '설정', icon: Settings, badge: 0, permission: 'settings' as const },
    ];

    // Add Admin Management for master only
    const masterOnlyItems = isMaster ? [
        { href: '/admin/admins', label: '관리자 계정', icon: Shield, badge: 0, permission: null }
    ] : [];

    // Filter nav items based on permissions
    const navItems = [
        ...allNavItems.filter(item => hasPermission(item.permission)),
        ...masterOnlyItems
    ];

    return (
        <ToastProvider>
            <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
                {/* Mobile Top Bar */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-50">
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>ESSENTIA ADMIN</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowShopConfirm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                            <Store className="w-4 h-4" />
                            <span>쇼핑몰</span>
                        </button>
                        <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="로그아웃">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Mobile Nav Bar (Multi-row) */}
                <nav className="md:hidden bg-white border-b border-gray-200">
                    <div className="flex flex-wrap p-2 gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px] ${isActive
                                        ? 'bg-green-100 text-green-900 border border-green-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Icon className={`w-6 h-6 ${isActive ? 'text-green-800' : ''}`} />
                                    <span>{item.label}</span>
                                    {item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-700 text-white text-[10px] flex items-center justify-center rounded-full">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Desktop Sidebar */}
                <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>ESSENTIA ADMIN</h1>
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
                                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-green-100 text-green-900 border border-green-300'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-green-800' : 'text-gray-500'}`} />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge > 0 && (
                                        <span className="bg-green-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-4 border-t border-gray-200 space-y-2">
                        <button onClick={() => setShowShopConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full font-medium">
                            <Store className="w-4 h-4" />
                            <span>쇼핑몰로 이동</span>
                        </button>
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

                {/* Go to Shop Confirmation Modal */}
                {showShopConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                            <h3 className="text-lg font-bold mb-4">쇼핑몰로 이동</h3>
                            <p className="text-gray-600 mb-6">관리자 페이지에서 나가시겠습니까?<br />쇼핑몰 메인 페이지로 이동합니다.</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowShopConfirm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleGoToShop}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    이동
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
        </ToastProvider>
    );
}
