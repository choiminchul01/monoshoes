"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
    orders?: Order[];
    source: "leads" | "member";
};

type Order = {
    id: string; created_at: string; order_number: string;
    final_amount: number; payment_status: string;
    shipping_address: string; shipping_address_detail: string;
};

const PAGE_SIZE = 100;       // 1페이지 = 100건
const PAGE_GROUP = 10;       // 페이지 번호 한 번에 10개 표시

// ─── 페이지네이션 컴포넌트 ────────────────────────────────────
function Paginator({
    currentPage,
    totalPages,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
}) {
    // 현재 페이지가 속한 그룹
    const groupIndex = Math.floor((currentPage - 1) / PAGE_GROUP);
    const groupStart = groupIndex * PAGE_GROUP + 1;
    const groupEnd   = Math.min(groupStart + PAGE_GROUP - 1, totalPages);

    const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);

    const hasPrevGroup = groupStart > 1;
    const hasNextGroup = groupEnd < totalPages;

    return (
        <div className="flex items-center justify-center gap-1 py-4">
            {/* 이전 그룹 */}
            <button
                onClick={() => onPageChange(groupStart - 1)}
                disabled={!hasPrevGroup}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* 페이지 번호 */}
            {pages.map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 text-sm rounded font-medium transition-colors
                        ${p === currentPage
                            ? "bg-black text-white"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                >
                    {p}
                </button>
            ))}

            {/* 다음 그룹 */}
            <button
                onClick={() => onPageChange(groupEnd + 1)}
                disabled={!hasNextGroup}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function AdminCustomersPage() {
    const toast = useToast();

    const [leads, setLeads]         = useState<RealLead[]>([]);
    const [leadsTotal, setLeadsTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [allMembers, setAllMembers] = useState<RealLead[]>([]);
    const [memberCount, setMemberCount] = useState(0);

    const [search, setSearch]               = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [loading, setLoading]             = useState(false);
    const [expandedId, setExpandedId]       = useState<number | string | null>(null);

    const [orderMap, setOrderMap] = useState<Map<string, Order[]>>(new Map());

    // ── 주문 메타 ────────────────────────────────────────────
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

    // ── 가입 회원 수 ─────────────────────────────────────────
    const loadMemberCount = useCallback(async () => {
        const res = await getMemberTotalCountAction();
        setMemberCount(res.count);
    }, []);

    // ── 가입 회원 목록 (검색 시) ──────────────────────────────
    const loadAllMembers = useCallback(async (searchVal: string) => {
        const res = await fetchAllMembersAction(searchVal || undefined);
        if (res.success) {
            setAllMembers((res.data as any[]).map(u => ({
                id: u.id, name: u.name, phone: u.phone, email: u.email,
                created_at: u.created_at, isRegistered: true, source: "member" as const,
            })));
        }
    }, []);

    // ── 마케팅 DB 조회 ────────────────────────────────────────
    const fetchLeads = useCallback(async (page: number, searchVal: string) => {
        setLoading(true);
        try {
            const res = await fetchRealLeadsAction({ page, pageSize: PAGE_SIZE, search: searchVal });
            if (res.success) {
                setLeads(res.data.map((d: any) => ({ ...d, source: "leads" as const })));
                setLeadsTotal(res.count);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // ── 초기 로드 ────────────────────────────────────────────
    useEffect(() => {
        loadMeta();
        loadMemberCount();
        fetchLeads(1, "");
    }, []);

    // ── 검색 조회 ────────────────────────────────────────────
    const handleSearchSubmit = async () => {
        setCurrentPage(1);
        setAppliedSearch(search);
        if (search.trim()) await loadAllMembers(search);
        else setAllMembers([]);
        fetchLeads(1, search);
    };

    // ── 페이지 변경 ──────────────────────────────────────────
    const handlePageChange = (p: number) => {
        setCurrentPage(p);
        setExpandedId(null);
        fetchLeads(p, appliedSearch);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── 새로고침 ─────────────────────────────────────────────
    const handleRefresh = () => {
        loadMeta();
        loadMemberCount();
        if (appliedSearch.trim()) loadAllMembers(appliedSearch);
        else setAllMembers([]);
        fetchLeads(currentPage, appliedSearch);
    };

    // ── 병합 (현재 페이지 리드 + 검색 시 회원) ───────────────
    const visibleLeads: RealLead[] = [
        ...leads.map(l => ({
            ...l,
            orders: orderMap.get(l.phone) || [],
        })),
        ...(appliedSearch.trim() ? allMembers.map(m => ({
            ...m,
            orders: orderMap.get(m.phone) || [],
        })) : []),
    ];

    const totalCount = leadsTotal + memberCount;
    const totalPages = Math.ceil(leadsTotal / PAGE_SIZE);

    // ── 성별 뱃지 ────────────────────────────────────────────
    const genderBadge = (g?: string) => {
        if (g === "M") return <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">남</span>;
        if (g === "F") return <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded border border-pink-200">여</span>;
        return <span className="text-[10px] text-gray-300">-</span>;
    };

    // ── 렌더 ─────────────────────────────────────────────────
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
            <div className="bg-white rounded-lg shadow overflow-hidden mb-2">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                        로딩 중...
                    </div>
                ) : visibleLeads.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        {appliedSearch ? "검색 결과가 없습니다." : "데이터가 없습니다."}
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
                                    <tr key={String(lead.id)} className="hover:bg-gray-50 transition-colors">
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 페이지 정보 + 페이지네이션 */}
            {!loading && totalPages > 1 && (
                <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">
                        {currentPage}페이지 / 전체 {totalPages.toLocaleString()}페이지
                        &nbsp;(페이지당 100건)
                    </p>
                    <Paginator
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
}
