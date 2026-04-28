"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, RefreshCw, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { fetchRealLeadsAction, fetchAllMembersAction, getMemberTotalCountAction } from "./actions";

// ─── Types ────────────────────────────────────────────────────
type RealLead = {
    id: number | string;
    name: string;
    phone: string;
    birth_date?: string | null;
    gender?: string;
    address_sido?: string | null;
    address_sigungu?: string | null;
    email?: string;
    created_at: string;
    isRegistered?: boolean;
    totalOrders?: number;
    totalSpent?: number;
    orders?: Order[];
    source: "leads" | "member";
};

type Order = {
    id: string; created_at: string; order_number: string;
    final_amount: number; payment_status: string;
    shipping_address: string; shipping_address_detail: string;
};

const SERVER_PAGE_SIZE = 100; // 서버에서 한 번에 가져오는 수
const DISPLAY_STEP = 10;      // 화면에 한 번에 보여주는 수

export default function AdminCustomersPage() {
    const toast = useToast();

    // ── 마케팅 DB 데이터 (서버 페이징) ──────────────────────────
    const [leads, setLeads] = useState<RealLead[]>([]);
    const [leadsTotal, setLeadsTotal] = useState(0);
    const [serverPage, setServerPage] = useState(1);   // 현재 서버 페이지

    // ── 가입 회원 (검색시만 표시) ─────────────────────────────
    const [allMembers, setAllMembers] = useState<RealLead[]>([]);
    const [memberCount, setMemberCount] = useState(0);

    // ── 화면 표시 수 (더보기) ─────────────────────────────────
    const [displayCount, setDisplayCount] = useState(DISPLAY_STEP);

    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [expandedId, setExpandedId] = useState<number | string | null>(null);

    // 주문 매핑
    const [orderMap, setOrderMap] = useState<Map<string, Order[]>>(new Map());

    // ── 주문 메타 로드 ────────────────────────────────────────
    const loadMeta = useCallback(async () => {
        try {
            const { data: orders } = await supabase
                .from("orders")
                .select("id, created_at, order_number, final_amount, payment_status, shipping_address, shipping_address_detail, shipping_phone")
                .order("created_at", { ascending: false });
            const oMap = new Map<string, Order[]>();
            orders?.forEach((o: any) => {
                const ph = o.shipping_phone;
                if (!ph) return;
                if (!oMap.has(ph)) oMap.set(ph, []);
                oMap.get(ph)!.push(o);
            });
            setOrderMap(oMap);
        } catch (e) { console.error("meta load error", e); }
    }, []);

    // ── 가입 회원 수 조회 (카운트 전용) ──────────────────────
    const loadMemberCount = useCallback(async () => {
        const res = await getMemberTotalCountAction();
        setMemberCount(res.count);
    }, []);

    // ── 가입 회원 목록 조회 (검색 시) ────────────────────────
    const loadAllMembers = useCallback(async (searchVal: string) => {
        const res = await fetchAllMembersAction(searchVal || undefined);
        if (res.success) {
            setAllMembers((res.data as any[]).map(u => ({
                id: u.id, name: u.name, phone: u.phone, email: u.email,
                created_at: u.created_at, isRegistered: true, source: "member" as const,
            })));
        }
    }, []);

    // ── 마케팅 DB 로드 (서버 페이지 append) ──────────────────
    const fetchLeads = useCallback(async (page: number, searchVal: string, append = false) => {
        if (append) setLoadingMore(true); else setLoading(true);
        try {
            const res = await fetchRealLeadsAction({ page, pageSize: SERVER_PAGE_SIZE, search: searchVal });
            if (res.success) {
                const mapped = res.data.map((d: any) => ({ ...d, source: "leads" as const }));
                setLeads(prev => append ? [...prev, ...mapped] : mapped);
                setLeadsTotal(res.count);
            }
        } finally {
            if (append) setLoadingMore(false); else setLoading(false);
        }
    }, []);

    // ── 초기 로드 ─────────────────────────────────────────────
    useEffect(() => {
        loadMeta();
        loadMemberCount();
        fetchLeads(1, "");
    }, []);

    // ── 조회 버튼 / Enter ──────────────────────────────────────
    const handleSearchSubmit = async () => {
        setAppliedSearch(search);
        setServerPage(1);
        setDisplayCount(DISPLAY_STEP);
        setLeads([]);
        if (search.trim()) await loadAllMembers(search);
        else setAllMembers([]);
        fetchLeads(1, search, false);
    };

    // ── 병합 데이터 ────────────────────────────────────────────
    const mergedLeads: RealLead[] = [
        ...leads.map(l => ({
            ...l,
            totalOrders: orderMap.get(l.phone)?.length || 0,
            totalSpent: orderMap.get(l.phone)?.filter(o => ["paid","shipped","delivered"].includes(o.payment_status)).reduce((s,o) => s + o.final_amount, 0) || 0,
            orders: orderMap.get(l.phone) || [],
        })),
        ...(appliedSearch.trim() ? allMembers.map(m => ({
            ...m,
            totalOrders: orderMap.get(m.phone)?.length || 0,
            totalSpent: orderMap.get(m.phone)?.filter(o => ["paid","shipped","delivered"].includes(o.payment_status)).reduce((s,o) => s + o.final_amount, 0) || 0,
            orders: orderMap.get(m.phone) || [],
        })) : []),
    ];

    // 화면에 보일 슬라이스
    const visibleLeads = mergedLeads.slice(0, displayCount);
    const totalCount = leadsTotal + memberCount;
    const hasMoreLocal = displayCount < mergedLeads.length;
    const hasMoreServer = leads.length < leadsTotal; // 서버에 더 있음

    // ── 더보기 버튼 핸들러 ────────────────────────────────────
    const handleLoadMore = async () => {
        const nextDisplay = displayCount + DISPLAY_STEP;

        // 로컬 버퍼에 데이터가 충분한 경우
        if (nextDisplay <= mergedLeads.length) {
            setDisplayCount(nextDisplay);
            return;
        }

        // 서버에서 다음 페이지 가져와야 하는 경우
        if (hasMoreServer) {
            const nextPage = serverPage + 1;
            setServerPage(nextPage);
            await fetchLeads(nextPage, appliedSearch, true); // append
        }

        setDisplayCount(nextDisplay);
    };

    const handleRefresh = () => {
        setDisplayCount(DISPLAY_STEP);
        setServerPage(1);
        loadMeta();
        loadMemberCount();
        if (appliedSearch.trim()) {
            loadAllMembers(appliedSearch);
        } else {
            setAllMembers([]);
        }
        fetchLeads(1, appliedSearch, false);
    };

    // ── 성별 뱃지 ────────────────────────────────────────────
    const genderBadge = (g?: string) => {
        if (g === "M") return <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">남</span>;
        if (g === "F") return <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded border border-pink-200">여</span>;
        return <span className="text-[10px] text-gray-300">-</span>;
    };

    const statusLabel = (s: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            paid:      { label: "입금완료", cls: "bg-green-100 text-green-800" },
            shipped:   { label: "배송중",   cls: "bg-purple-100 text-purple-800" },
            delivered: { label: "배송완료", cls: "bg-blue-100 text-blue-800" },
            pending:   { label: "입금대기", cls: "bg-yellow-100 text-yellow-800" },
            cancelled: { label: "취소",     cls: "bg-red-100 text-red-700" },
        };
        const m = map[s] || { label: s, cls: "bg-gray-100 text-gray-600" };
        return <span className={`px-2 py-0.5 rounded text-xs ${m.cls}`}>{m.label}</span>;
    };

    // ─────────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div className="flex flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">고객 관리</h1>
                    <span className="text-sm text-gray-400 font-medium">총 {totalCount.toLocaleString()}명</span>
                </div>
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <RefreshCw className="w-4 h-4" /> 새로고침
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                        placeholder="이름, 전화번호 검색..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-shadow text-sm"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                </div>
                <button
                    onClick={handleSearchSubmit}
                    disabled={loading}
                    className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
                >
                    조회
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                        로딩 중...
                    </div>
                ) : visibleLeads.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        {search ? "검색 결과가 없습니다." : "데이터가 없습니다."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">성별</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생년월일</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {visibleLeads.map((lead) => (
                                    <React.Fragment key={String(lead.id)}>
                                        <tr className={`hover:bg-gray-50 transition-colors ${expandedId === lead.id ? "bg-gray-50" : ""}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                        <User className="w-3.5 h-3.5 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{lead.name}</div>
                                                        {lead.email && <div className="text-[11px] text-gray-400">{lead.email}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{lead.phone}</td>
                                            <td className="px-4 py-3">{genderBadge(lead.gender)}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{lead.birth_date || "-"}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {[lead.address_sido, lead.address_sigungu].filter(Boolean).join(" ") || "-"}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 현재 표시 수 / 더보기 */}
            {!loading && mergedLeads.length > 0 && (
                <div className="flex flex-col items-center gap-3 pb-6">
                    <p className="text-xs text-gray-400">
                        {Math.min(displayCount, mergedLeads.length).toLocaleString()}명 표시 중
                        {(hasMoreLocal || hasMoreServer) && ` / 로드된 ${mergedLeads.length.toLocaleString()}명`}
                    </p>
                    {(hasMoreLocal || hasMoreServer) && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-8 py-2.5 bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-full hover:border-black hover:text-black transition-all disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <span className="flex items-center gap-2">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 로딩 중...
                                </span>
                            ) : `10명 더보기`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
