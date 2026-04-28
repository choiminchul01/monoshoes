"use client";

import { ShoppingBag, Clock, TrendingUp, ArrowRight, User, AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';

// ──────────────────────────────────────────────
// 임의 고정값 (데모용 Mock Data)
// 3년 운영 총매출 약 9억 기준 · 월 평균 3~4천만원
// ──────────────────────────────────────────────
const MOCK_STATS = {
    totalRevenue: 897_364_200,
    todayRevenue: 463_700,
    totalOrders: 12_847,
    todayOrders: 6,
    pendingOrders: 7,
    lowStockCount: 3,
};

const MOCK_MONTHLY_REVENUE = [
    { label: '11월', amount: 32_847_300 },
    { label: '12월', amount: 45_216_800 },
    { label: '1월',  amount: 18_432_500 },
    { label: '2월',  amount: 23_891_400 },
    { label: '3월',  amount: 34_578_600 },
    { label: '4월',  amount: 41_234_700 },
];

const MOCK_RECENT_ORDERS = [
    { id: '1', shipping_name: '김민지', order_number: 'ORD-20260429-0841', final_amount: 89_500,  payment_status: 'paid' },
    { id: '2', shipping_name: '이서연', order_number: 'ORD-20260429-0723', final_amount: 147_200, payment_status: 'pending' },
    { id: '3', shipping_name: '박준혁', order_number: 'ORD-20260429-0612', final_amount: 63_800,  payment_status: 'paid' },
    { id: '4', shipping_name: '최유나', order_number: 'ORD-20260428-2247', final_amount: 118_500, payment_status: 'shipped' },
    { id: '5', shipping_name: '정다은', order_number: 'ORD-20260428-1952', final_amount: 34_900,  payment_status: 'delivered' },
    { id: '6', shipping_name: '한지수', order_number: 'ORD-20260428-1637', final_amount: 156_300, payment_status: 'paid' },
    { id: '7', shipping_name: '오승민', order_number: 'ORD-20260428-1423', final_amount: 79_800,  payment_status: 'pending' },
    { id: '8', shipping_name: '윤채원', order_number: 'ORD-20260428-1124', final_amount: 95_700,  payment_status: 'shipped' },
];

// ── 모노크롬 상태 스타일 ──
const STATUS_STYLE: Record<string, { label: string; dot: string; text: string }> = {
    paid:      { label: '입금완료', dot: 'bg-gray-900',  text: 'text-gray-900' },
    pending:   { label: '입금대기', dot: 'bg-gray-400',  text: 'text-gray-500' },
    shipped:   { label: '배송중',   dot: 'bg-gray-600',  text: 'text-gray-600' },
    delivered: { label: '배송완료', dot: 'bg-gray-300',  text: 'text-gray-400' },
    cancelled: { label: '취소',     dot: 'bg-gray-200',  text: 'text-gray-300' },
};

function formatWon(amount: number) {
    return amount.toLocaleString('ko-KR') + '원';
}

function formatDate(d: Date) {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminDashboard() {
    const maxRevenue = Math.max(...MOCK_MONTHLY_REVENUE.map(d => d.amount));
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 3);
    startDate.setDate(startDate.getDate() + 1); // 정확히 3년 전 다음날 시작
    const periodLabel = `${formatDate(startDate)} – ${formatDate(today)}`;
    const alertCount = MOCK_STATS.pendingOrders + MOCK_STATS.lowStockCount;

    return (
        <div className="max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">대시보드</h1>
                </div>
                {alertCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-medium tracking-wide">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        {alertCount}건 확인 필요
                    </div>
                )}
            </div>

            {/* ── 요약 카드 3개 ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                {/* 총 매출 — 강조 카드 (다크) */}
                <div className="bg-gray-900 text-white p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-gray-400 tracking-widest uppercase">총 매출</p>
                            <span className="text-[10px] text-gray-500 font-mono">{periodLabel}</span>
                        </div>
                        <p className="text-3xl font-black tracking-tight">{formatWon(MOCK_STATS.totalRevenue)}</p>
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>오늘 <span className="text-white font-semibold">+{formatWon(MOCK_STATS.todayRevenue)}</span></span>
                        </div>
                    </div>
                </div>

                {/* 총 주문수 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-400 tracking-widest uppercase">총 주문수</p>
                        <ShoppingBag className="w-4 h-4 text-gray-300" />
                    </div>
                    <p className="text-[10px] text-gray-300 font-mono mb-2">{periodLabel}</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{MOCK_STATS.totalOrders.toLocaleString()}<span className="text-lg font-medium text-gray-400 ml-1">건</span></p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>오늘 <span className="text-gray-900 font-semibold">+{MOCK_STATS.todayOrders}건</span></span>
                    </div>
                </div>

                {/* 처리 대기 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-gray-400 tracking-widest uppercase">처리 대기</p>
                        <Clock className="w-4 h-4 text-gray-300" />
                    </div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{MOCK_STATS.pendingOrders}<span className="text-lg font-medium text-gray-400 ml-1">건</span></p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                        <span>입금 확인 필요</span>
                    </div>
                </div>
            </div>

            {/* ── 차트 + 최근 주문 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* 매출 차트 (3/5) */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">최근 6개월 매출</h2>
                        <span className="text-xs text-gray-400">{(maxRevenue / 10000).toLocaleString()}만원 최고</span>
                    </div>

                    <div className="h-56 flex items-end justify-between gap-3 px-2">
                        {MOCK_MONTHLY_REVENUE.map((month, index) => {
                            const heightPct = (month.amount / maxRevenue) * 100;
                            const isMax = month.amount === maxRevenue;
                            return (
                                <div key={index} className="flex flex-col items-center flex-1 group cursor-default">
                                    <div className="relative w-full flex justify-center items-end h-44">
                                        <div
                                            className={`w-full rounded-md transition-all duration-300 relative ${
                                                isMax ? 'bg-gray-900' : 'bg-gray-200 group-hover:bg-gray-400'
                                            }`}
                                            style={{ height: `${heightPct}%` }}
                                        >
                                            {/* 툴팁 */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-medium">
                                                {formatWon(month.amount)}
                                            </div>
                                        </div>
                                    </div>
                                    {/* 금액 라벨 */}
                                    <p className={`text-[10px] mt-2 font-semibold tabular-nums ${isMax ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {(month.amount / 10000).toLocaleString()}만
                                    </p>
                                    {/* 월 라벨 */}
                                    <span className={`text-xs mt-1 font-medium ${isMax ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {month.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 최근 주문 (2/5) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase">최근 주문</h2>
                        <Link href="/admin/orders" className="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors">
                            전체보기 <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto">
                        {MOCK_RECENT_ORDERS.map(order => {
                            const status = STATUS_STYLE[order.payment_status] ?? { label: order.payment_status, dot: 'bg-gray-300', text: 'text-gray-400' };
                            return (
                                <div key={order.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{order.shipping_name}</p>
                                            <p className="text-[10px] text-gray-300 font-mono truncate">{order.order_number}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="text-sm font-bold text-gray-900 tabular-nums">{order.final_amount.toLocaleString()}<span className="text-xs font-normal text-gray-400">원</span></p>
                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                            <span className={`text-[10px] font-medium ${status.text}`}>{status.label}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── 재고 부족 알림 ── */}
            {MOCK_STATS.lowStockCount > 0 && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                재고 부족 <span className="font-black">{MOCK_STATS.lowStockCount}</span>건
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">5개 미만 상품이 있습니다</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/products"
                        className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        재고 관리 →
                    </Link>
                </div>
            )}
        </div>
    );
}
