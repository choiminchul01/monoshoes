"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Package, Users, Settings, Home, Store, LogOut, MessageSquare, HelpCircle, FileText, Shield, Ticket, Megaphone, Handshake, ChevronDown, LayoutDashboard, KeyRound, Eye, EyeOff, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ToastProvider } from '@/context/ToastContext';
import { useAdminPermissions } from '@/lib/useAdminPermissions';

// ─── Shoe Drawing Loader ───────────────────────────────────────────────
function AdminShoeLoader() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const start = Date.now();
        const duration = 1800;
        const tick = () => {
            const elapsed = Date.now() - start;
            const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
            setProgress(pct);
            if (pct < 100) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, []);

    return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] gap-6">
            {/* Brand */}
            <p className="text-[11px] tracking-[0.45em] font-black text-gray-300 uppercase"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                MONO SHOES
            </p>

            {/* Progress bar */}
            <div className="w-40 h-[2px] bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-75"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Percentage */}
            <p className="text-[11px] tracking-widest text-gray-400 font-light tabular-nums">
                {progress}%
            </p>
        </div>
    );
}
// ──────────────────────────────────────────────────────────────────────

// Admin validation now uses admin_roles table via useAdminPermissions hook

// ─── Password Change Modal ────────────────────────────────────────────
function PasswordChangeModal({ supabase, onClose }: { supabase: any; onClose: () => void }) {
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);
        if (newPw.length < 6) { setResult({ ok: false, msg: '비밀번호는 최소 6자 이상이어야 합니다.' }); return; }
        if (newPw !== confirmPw) { setResult({ ok: false, msg: '비밀번호가 일치하지 않습니다.' }); return; }

        setSaving(true);
        const { error } = await supabase.auth.updateUser({ password: newPw });
        setSaving(false);

        if (error) { setResult({ ok: false, msg: error.message }); }
        else { setResult({ ok: true, msg: '비밀번호가 성공적으로 변경되었습니다.' }); setNewPw(''); setConfirmPw(''); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-bold">내 비밀번호 변경</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                        <div className="relative">
                            <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                                placeholder="최소 6자 이상" required minLength={6}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
                            <button type="button" onClick={() => setShowPw(!showPw)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                        <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                            placeholder="비밀번호 재입력" required minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
                    </div>
                    {result && (
                        <div className={`text-sm px-3 py-2 rounded-lg ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {result.msg}
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">취소</button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold disabled:opacity-50">
                            {saving ? '변경 중...' : '비밀번호 변경'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
// ──────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const { hasPermission, isMaster, loading: permLoading } = useAdminPermissions();
    const supabase = createClientComponentClient();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showShopConfirm, setShowShopConfirm] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [counts, setCounts] = useState({ products: 0 });
    const [forceReady, setForceReady] = useState(false);

    // State for collapsible sidebar groups (initially all open)
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['대시보드', '쇼핑몰 관리', '고객 및 마케팅', '시스템']);

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    useEffect(() => {
        if (forceReady) return; // 타임아웃 후엔 리다이렉트 생략
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
    }, [user, loading, permLoading, hasPermission, router, forceReady]);

    const fetchNotificationCounts = async () => {
        try {
            // Low Stock Products
            const { count: lowStock } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .lt('stock', 5);

            setCounts({
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


    // Supabase 응답이 늦을 경우 3초 후 강제 진입
    useEffect(() => {
        const timer = setTimeout(() => setForceReady(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    if ((loading || permLoading) && !forceReady) {
        return <AdminShoeLoader />;
    }

    if (!forceReady && (!user || permLoading || !hasPermission('dashboard'))) {
        return null;
    }

    // Define navigation groups
    const navGroups = [
        {
            title: '대시보드',
            icon: LayoutDashboard,
            items: [
                { href: '/admin', label: '대시보드', icon: Home, badge: 0, permission: 'dashboard' as const },
            ]
        },
        {
            title: '쇼핑몰 관리',
            icon: Store,
            items: [
                { href: '/admin/products', label: '상품 관리', icon: Package, badge: counts.products, permission: 'products' as const },
                { href: '/admin/events', label: '이벤트/팝업 관리', icon: Megaphone, badge: 0, permission: 'board' as const },
                { href: '/admin/reviews', label: '리뷰 관리', icon: MessageSquare, badge: 0, permission: 'reviews' as const },
            ]
        },
        {
            title: '고객 및 마케팅',
            icon: Users,
            items: [
                { href: '/admin/customers', label: '고객 관리', icon: Users, badge: 0, permission: 'customers' as const },
                { href: '/admin/leads', label: '고객 DB (마케팅)', icon: Users, badge: 0, permission: 'customers' as const },
                { href: '/admin/inquiries', label: '문의 관리', icon: HelpCircle, badge: 0, permission: 'inquiries' as const },
            ]
        },
        {
            title: '시스템',
            icon: Settings,
            items: [
                { href: '/admin/settings', label: '설정', icon: Settings, badge: 0, permission: 'settings' as const },
                // Master only items
                ...(isMaster ? [
                    { href: '/admin/admins', label: '관리자 계정', icon: Shield, badge: 0, permission: null },
                ] : [])
            ]
        }
    ];

    // Filter items based on permissions
    const filteredGroups = navGroups.map(group => ({
        ...group,
        items: group.items.filter(item => item.permission === null || hasPermission(item.permission))
    })).filter(group => group.items.length > 0);

    // Flatten for mobile view
    const mobileNavItems = filteredGroups.flatMap(group => group.items);

    return (
        <ToastProvider>
            <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
                {/* Mobile Top Bar */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-50">
                    <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>MONO SHOES ADMIN</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowShopConfirm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                            <Store className="w-4 h-4" />
                            <span>쇼핑몰</span>
                        </button>
                        <button onClick={() => setShowPasswordChange(true)} className="p-2 text-gray-500 hover:text-gray-700 transition-colors" title="비밀번호 변경">
                            <KeyRound className="w-5 h-5" />
                        </button>
                        <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="로그아웃">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Mobile Nav Bar (Multi-row) */}
                <nav className="md:hidden bg-white border-b border-gray-200">
                    <div className="flex flex-wrap p-2 gap-2">
                        {mobileNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px] relative ${isActive
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : ''}`} />
                                    <span>{item.label}</span>
                                    {item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Desktop Sidebar */}
                <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-full">
                    <div className="p-6 border-b border-gray-200 flex-shrink-0">
                        <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>MONO SHOES</h1>
                        <p className="text-sm text-gray-500 mt-1">관리자 패널</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {filteredGroups.map((group, groupIndex) => {
                            const isExpanded = expandedGroups.includes(group.title);
                            const hasActiveChild = group.items.some(item => item.href === pathname);
                            const GroupIcon = group.icon;

                            return (
                                <div key={group.title} className={`${groupIndex > 0 ? 'border-t border-gray-100 pt-2 mt-2' : ''}`}>
                                    {group.title !== '대시보드' ? (
                                        <button
                                            onClick={() => toggleGroup(group.title)}
                                            className="w-full flex items-center justify-between px-3 py-3 text-base font-bold text-gray-800 hover:bg-gray-50 rounded-lg transition-colors mb-1 group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <GroupIcon className="w-5 h-5 text-gray-500" />
                                                <span className={hasActiveChild ? 'text-gray-900 font-bold' : ''}>{group.title}</span>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`} />
                                        </button>
                                    ) : (
                                        <Link
                                            href="/admin"
                                            className="w-full flex items-center justify-between px-3 py-3 text-base font-bold text-gray-800 hover:bg-gray-50 rounded-lg transition-colors mb-1 group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <GroupIcon className="w-5 h-5 text-gray-600" />
                                                <span className={hasActiveChild ? 'text-green-700' : ''}>{group.title}</span>
                                            </div>
                                        </Link>
                                    )}

                                    {group.title !== '대시보드' && (
                                        <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = pathname === item.href;
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                                                            ? 'bg-gray-900 text-white font-semibold shadow-sm'
                                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                                            <span className="text-sm">{item.label}</span>
                                                        </div>
                                                        {item.badge > 0 && (
                                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                        {isActive && (
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-900 rounded-r-full" />
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="p-4 border-t border-gray-200 space-y-2">
                        <button onClick={() => setShowShopConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-3 text-base text-gray-800 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full font-bold">
                            <Store className="w-5 h-5 text-gray-600" />
                            <span>쇼핑몰로 이동</span>
                        </button>
                        <button
                            onClick={() => setShowPasswordChange(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors w-full"
                        >
                            <KeyRound className="w-4 h-4" />
                            <span>비밀번호 변경</span>
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

                <main className="flex-1 overflow-y-auto relative bg-gray-50/50 backdrop-blur-sm">
                    {/* Watermark Background */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 opacity-[0.03]">
                        <span 
                            className="text-[15vw] font-black whitespace-nowrap text-gray-900 select-none" 
                            style={{ fontFamily: 'var(--font-cinzel), serif' }}
                        >
                            MONO SHOES
                        </span>
                    </div>
                    {/* Content */}
                    <div className="relative z-10 p-4 md:p-8 min-h-full">
                        {children}
                    </div>
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

                {/* Password Change Modal */}
                {showPasswordChange && <PasswordChangeModal supabase={supabase} onClose={() => setShowPasswordChange(false)} />}
            </div>
        </ToastProvider>
    );
}
