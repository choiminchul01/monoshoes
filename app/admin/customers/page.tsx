"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, ShoppingBag, ChevronDown, ChevronUp, RefreshCw, UserCheck } from "lucide-react";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import { fetchRealLeadsAction, fetchUnmatchedMembersAction } from "./actions";

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

    // ── 미업로드 가입 회원 ─────────────────────────────────────
    const [unmatchedMembers, setUnmatchedMembers] = useState<RealLead[]>([]);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | string | null>(null);

    // 주문 매핑 (전화번호 → 주문 목록)
    const [orderMap, setOrderMap] = useState<Map<string, Order[]>>(new Map());
    const [memberPhones, setMemberPhones] = useState<Set<string>>(new Set());

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

    // ── 미업로드 가입 회원 로드 ───────────────────────────────
    const loadUnmatched = useCallback(async (searchVal: string) => {
        const res = await fetchUnmatchedMembersAction(searchVal || undefined);
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
            setUnmatchedMembers(members);
            setMemberPhones(new Set(members.map(m => m.phone)));
        }
    }, []);

    // ── 마케팅 DB 리드 로드 ───────────────────────────────────
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

    // ── 초기 로드 ─────────────────────────────────────────────
    useEffect(() => {
        loadMeta();
        fetchLeads(1, "");
        loadUnmatched("");
    }, []);

    // ── 리드 + 미업로드 회원 병합 ─────────────────────────────
    // 미업로드 회원 중 검색어 필터는 서버에서 처리됨
    const mergedLeads: RealLead[] = [
        // 미업로드 가입 회원을 상단에 표시
        ...unmatchedMembers.map(m => ({
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

    const totalCount = leadsTotal + unmatchedMembers.length;
    const totalPages = Math.ceil(leadsTotal / PAGE_SIZE); // 마케팅DB 기준 페이징

    const handleSearch = (val: string) => {
        setSearch(val);
        setLeadsPage(1);
        fetchLeads(1, val);
        loadUnmatched(val);
    };

    const handlePageChange = (p: number) => {
        setLeadsPage(p);
        fetchLeads(p, search);
        setExpandedId(null);
    };

    const handleRefresh = () => {
        loadMeta();
        fetchLeads(leadsPage, search);
        loadUnmatched(search);
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
                    {unmatchedMembers.length > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">
                            <UserCheck className="w-3 h-3" />
                            가입 회원 {unmatchedMembers.length}명 포함
                        </span>
                    )}
                </div>
                <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <RefreshCw className="w-4 h-4" /> 새로고침
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <AdminSearch value={search} onChange={handleSearch} placeholder="이름, 전화번호 검색..." />
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회원</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">결제금액</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상세</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {mergedLeads.map((lead) => (
                                    <React.Fragment key={String(lead.id)}>
                                        <tr className={`hover:bg-gray-50 transition-colors ${lead.source === "member" ? "bg-green-50/40" : ""} ${expandedId === lead.id ? "bg-gray-50" : ""}`}>
                                            {/* 이름 */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${lead.source === "member" ? "bg-green-100" : "bg-gray-100"}`}>
                                                        <User className={`w-3.5 h-3.5 ${lead.source === "member" ? "text-green-600" : "text-gray-500"}`} />
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
                                            {/* 회원 여부 */}
                                            <td className="px-4 py-3">
                                                {lead.isRegistered
                                                    ? <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded border border-green-200">회원</span>
                                                    : <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">비회원</span>
                                                }
                                            </td>
                                            {/* 주문 수 */}
                                            <td className="px-4 py-3">
                                                {(lead.totalOrders || 0) > 0
                                                    ? <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{lead.totalOrders}건</span>
                                                    : <span className="text-gray-300 text-xs">-</span>
                                                }
                                            </td>
                                            {/* 결제금액 */}
                                            <td className="px-4 py-3 font-bold text-sm">
                                                {(lead.totalSpent || 0) > 0
                                                    ? `${lead.totalSpent!.toLocaleString()}원`
                                                    : <span className="text-gray-300 font-normal text-xs">-</span>
                                                }
                                            </td>
                                            {/* 주문 상세 토글 */}
                                            <td className="px-4 py-3 text-gray-400 cursor-pointer" onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}>
                                                {(lead.orders?.length || 0) > 0
                                                    ? (expandedId === lead.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)
                                                    : <span className="text-[10px] text-gray-200">-</span>
                                                }
                                            </td>
                                        </tr>

                                        {/* 주문 상세 펼침 */}
                                        {expandedId === lead.id && (lead.orders?.length || 0) > 0 && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={9} className="px-6 py-4">
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
