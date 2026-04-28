"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, RefreshCw } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import { fetchRealLeadsAction, fetchAllMembersAction } from "./actions";

// ─── Types ────────────────────────────────────────────────────
type RealLead = {
    id: number | string;   // 마케팅DB=number, 가입회원=uuid string
    name: string;
    phone: string;
    birth_date?: string | null;
    gender?: string;
    address_sido?: string | null;
    address_sigungu?: string | null;
    email?: string;
    created_at: string;
    // 매칭 후 추가
    isRegistered?: boolean;
    totalOrders?: number;
    totalSpent?: number;
    orders?: Order[];
    source: "leads" | "member";  // 데이터 출처
};

type Order = {
    id: string; created_at: string; order_number: string;
    final_amount: number; payment_status: string;
    shipping_address: string; shipping_address_detail: string;
};

const PAGE_SIZE = 100;

export default function AdminCustomersPage() {
    const toast = useToast();

    // ── 마케팅 DB (is_real=true) ──────────────────────────────
    const [leads, setLeads] = useState<RealLead[]>([]);
    const [leadsTotal, setLeadsTotal] = useState(0);
    const [leadsPage, setLeadsPage] = useState(1);

    // ── 가입 회원 (전체, 상단 고정) ───────────────────────────
    const [allMembers, setAllMembers] = useState<RealLead[]>([]);
    const [memberPhoneSet, setMemberPhoneSet] = useState<Set<string>>(new Set());

    const [search, setSearch] = useState("");          // 입력창 텍스트 (즉시 반영)
    const [appliedSearch, setAppliedSearch] = useState(""); // 실제 조회에 사용된 검색어
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | string | null>(null);

    // 주문 매핑 (전화번호 → 주문 목록)
    const [orderMap, setOrderMap] = useState<Map<string, Order[]>>(new Map());

    // ── 주문 + 회원 메타 로드 ─────────────────────────────────
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

    // ── 가입 회원 전체 로드 (상단 고정 표시) ─────────────────
    const loadAllMembers = useCallback(async (searchVal: string) => {
        const res = await fetchAllMembersAction(searchVal || undefined);
        if (res.success) {
            const members: RealLead[] = (res.data as any[]).map(u => ({
                id: u.id,
                name: u.name,
                phone: u.phone,
                email: u.email,
                created_at: u.created_at,
                isRegistered: true,
                source: "member" as const,
            }));
            setAllMembers(members);
            setMemberPhoneSet(new Set(members.map(m => m.phone)));
        }
    }, []);

    // ── 마케팅 DB 리드 로드 (가입 회원 전화번호 제외) ─────────
    const fetchLeads = useCallback(async (page: number, searchVal: string, excludePhones?: string[]) => {
        setLoading(true);
        try {
            const res = await fetchRealLeadsAction({ page, pageSize: PAGE_SIZE, search: searchVal, excludePhones });
            if (res.success) {
                setLeads(res.data.map((d: any) => ({ ...d, source: "leads" as const })));
                setLeadsTotal(res.count);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // ── 초기 로드 ─────────────────────────────────────────────
    useEffect(() => {
        loadMeta();
        loadAllMembers("").then(() => {
            // 회원 로드 후 전화번호 목록으로 마케팅 DB 조회
            fetchLeads(1, "");
        });
    }, []);

    // ── 조회 실행 (버튼 or Enter) ─────────────────────────────
    const handleSearchSubmit = async () => {
        setLeadsPage(1);
        setAppliedSearch(search);
        await loadAllMembers(search);
        fetchLeads(1, search);
    };

    // ── 가입 회원 + 마케팅 DB 병합 (가입 회원 상단 고정) ──────
    const mergedLeads: RealLead[] = [
        // 가입 회원 전원 상단 고정
        ...allMembers.map(m => ({
            ...m,
            totalOrders: orderMap.get(m.phone)?.length || 0,
            totalSpent: orderMap.get(m.phone)?.filter(o => ["paid","shipped","delivered"].includes(o.payment_status)).reduce((s,o) => s + o.final_amount, 0) || 0,
            orders: orderMap.get(m.phone) || [],
        })),
        // 마케팅 DB (is_real=true)
        ...leads.map(l => ({
            ...l,
            isRegistered: memberPhones.has(l.phone),
            totalOrders: orderMap.get(l.phone)?.length || 0,
            totalSpent: orderMap.get(l.phone)?.filter(o => ["paid","shipped","delivered"].includes(o.payment_status)).reduce((s,o) => s + o.final_amount, 0) || 0,
            orders: orderMap.get(l.phone) || [],
        })),
    ];

    const totalCount = leadsTotal + allMembers.length;
    const totalPages = Math.ceil(leadsTotal / PAGE_SIZE); // 마케팅DB 기준 페이징

    const handleSearch = (val: string) => {
        setSearch(val);
        setLeadsPage(1);
        fetchLeads(1, val);
        loadUnmatched(val);
    };

    const handlePageChange = (p: number) => {
        setLeadsPage(p);
        fetchLeads(p, appliedSearch);
        setExpandedId(null);
    };

    const handleRefresh = () => {
        loadMeta();
        loadAllMembers(appliedSearch).then(() => fetchLeads(leadsPage, appliedSearch));
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
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                        로딩 중...
                    </div>
                ) : mergedLeads.length === 0 ? (
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
                                {mergedLeads.map((lead) => (
                                    <React.Fragment key={String(lead.id)}>
                                        <tr className={`hover:bg-gray-50 transition-colors ${expandedId === lead.id ? "bg-gray-50" : ""}`}>
                                            {/* 이름 */}
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
                                            {/* 연락처 */}
                                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{lead.phone}</td>
                                            {/* 성별 */}
                                            <td className="px-4 py-3">{genderBadge(lead.gender)}</td>
                                            {/* 생년월일 */}
                                            <td className="px-4 py-3 text-gray-500 text-xs">{lead.birth_date || "-"}</td>
                                            {/* 지역 */}
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {[lead.address_sido, lead.address_sigungu].filter(Boolean).join(" ") || "-"}
                                            </td>
                                        </tr>

                                        {/* 주문 상세 펼침 */}
                                        {expandedId === lead.id && (lead.orders?.length || 0) > 0 && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="bg-white rounded border border-gray-200 p-4">
                                                        <h4 className="font-bold mb-3 flex items-center gap-2 text-sm">
                                                            <ShoppingBag className="w-4 h-4" /> 주문 이력
                                                        </h4>
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left">주문번호</th>
                                                                    <th className="px-3 py-2 text-left">주문일자</th>
                                                                    <th className="px-3 py-2 text-left">금액</th>
                                                                    <th className="px-3 py-2 text-left">상태</th>
                                                                    <th className="px-3 py-2 text-left">배송지</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {lead.orders!.map(order => (
                                                                    <tr key={order.id}>
                                                                        <td className="px-3 py-2 font-mono">{order.order_number}</td>
                                                                        <td className="px-3 py-2">{new Date(order.created_at).toLocaleDateString("ko-KR")}</td>
                                                                        <td className="px-3 py-2 font-bold">{order.final_amount.toLocaleString()}원</td>
                                                                        <td className="px-3 py-2">{statusLabel(order.payment_status)}</td>
                                                                        <td className="px-3 py-2 text-gray-500 truncate max-w-xs">{order.shipping_address} {order.shipping_address_detail}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 페이지네이션 — 마케팅DB 기준 */}
            {totalPages > 1 && (
                <Pagination currentPage={leadsPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
        </div>
    );
}
