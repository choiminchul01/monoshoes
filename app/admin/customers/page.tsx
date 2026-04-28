"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, ShoppingBag, ChevronDown, ChevronUp, RefreshCw, Trash2, Database, Users } from "lucide-react";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import { fetchAllUsersAction, fetchRealLeadsAction, getRealLeadsCountAction } from "./actions";

// ─── Types ────────────────────────────────────────────────────
type Order = {
    id: string; created_at: string; order_number: string;
    final_amount: number; payment_status: string;
    shipping_name: string; shipping_phone: string;
    shipping_address: string; shipping_address_detail: string;
    customer_email?: string; user_id?: string;
};
type Customer = {
    id: string; email: string; name: string; phone: string;
    address: string; totalOrders: number; totalSpent: number;
    lastOrderDate: string; orders: Order[]; isRegistered: boolean;
};
type RealLead = {
    id: number; name: string; phone: string; birth_date: string | null;
    gender: string; address_sido: string | null; address_sigungu: string | null;
    address_dong: string | null; created_at: string;
};

const PAGE_SIZE = 100;

export default function AdminCustomersPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<"leads" | "members">("leads");

    // ── 자사몰 유입 고객 (marketing_leads, is_real=true) ──────────
    const [leads, setLeads] = useState<RealLead[]>([]);
    const [leadsTotal, setLeadsTotal] = useState(0);
    const [leadsPage, setLeadsPage] = useState(1);
    const [leadsSearch, setLeadsSearch] = useState("");
    const [leadsLoading, setLeadsLoading] = useState(false);

    const fetchLeads = useCallback(async (page: number, search: string) => {
        setLeadsLoading(true);
        try {
            const res = await fetchRealLeadsAction({ page, pageSize: PAGE_SIZE, search });
            if (res.success) {
                setLeads(res.data as RealLead[]);
                setLeadsTotal(res.count);
            }
        } finally {
            setLeadsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "leads") fetchLeads(leadsPage, leadsSearch);
    }, [activeTab, leadsPage]);

    const handleLeadsSearch = (val: string) => {
        setLeadsSearch(val);
        setLeadsPage(1);
        fetchLeads(1, val);
    };

    const leadsTotalPages = Math.ceil(leadsTotal / PAGE_SIZE);

    // ── 가입 회원 (기존 로직) ─────────────────────────────────────
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);
    const itemsPerPage = 100;

    const fetchCustomers = useCallback(async () => {
        setMembersLoading(true);
        try {
            const usersResult = await fetchAllUsersAction();
            const allRegisteredUsers = usersResult.success ? usersResult.users : [];
            const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
            const { data: blacklist } = await supabase.from("blacklisted_customers").select("phone");
            const blacklistedPhones = new Set(blacklist?.map((b: any) => b.phone) || []);
            const customerMap = new Map<string, Customer>();

            allRegisteredUsers?.forEach((user: any) => {
                if (user.phone && blacklistedPhones.has(user.phone)) return;
                customerMap.set(user.email, {
                    id: user.id, email: user.email || "", name: user.name, phone: user.phone,
                    address: user.address ? `${user.address} ${user.address_detail}` : "",
                    totalOrders: 0, totalSpent: 0, lastOrderDate: user.created_at, orders: [], isRegistered: true
                });
            });

            orders?.forEach((order: any) => {
                if (order.shipping_phone && blacklistedPhones.has(order.shipping_phone)) return;
                let customer = (order.customer_email && customerMap.get(order.customer_email))
                    || Array.from(customerMap.values()).find(c => c.phone === order.shipping_phone);
                if (!customer && order.shipping_phone) {
                    customer = {
                        id: order.shipping_phone, email: order.customer_email || "", name: order.shipping_name,
                        phone: order.shipping_phone, address: `${order.shipping_address} ${order.shipping_address_detail}`,
                        totalOrders: 0, totalSpent: 0, lastOrderDate: order.created_at, orders: [], isRegistered: false
                    };
                    customerMap.set(order.shipping_phone, customer);
                }
                if (customer) {
                    customer.totalOrders += 1;
                    if (['paid', 'shipped', 'delivered'].includes(order.payment_status)) customer.totalSpent += order.final_amount;
                    customer.orders.push(order);
                    if (new Date(order.created_at) > new Date(customer.lastOrderDate)) customer.lastOrderDate = order.created_at;
                }
            });

            setCustomers(Array.from(customerMap.values()).sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()));
            setSelectedCustomers([]);
        } finally {
            setMembersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "members") fetchCustomers();
    }, [activeTab]);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)
    );
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const currentCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleDeleteSelected = async () => {
        if (!selectedCustomers.length) { toast.error("삭제할 고객을 선택해주세요."); return; }
        if (!confirm(`${selectedCustomers.length}명을 블랙리스트에 추가하시겠습니까?`)) return;
        setDeleting(true);
        try {
            const toBlock = customers.filter(c => selectedCustomers.includes(c.phone));
            const { error } = await supabase.from("blacklisted_customers").insert(toBlock.map(c => ({ phone: c.phone, name: c.name, reason: "관리자에 의해 차단됨" })));
            if (error) throw error;
            toast.success(`${selectedCustomers.length}명이 블랙리스트에 추가되었습니다.`);
            setSelectedCustomers([]);
            fetchCustomers();
        } catch { toast.error("처리 중 오류가 발생했습니다."); }
        finally { setDeleting(false); }
    };

    // ── 성별 뱃지 ────────────────────────────────────────────────
    const genderBadge = (g: string) => {
        if (g === "M") return <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">남</span>;
        if (g === "F") return <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded border border-pink-200">여</span>;
        return null;
    };

    // ─────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div className="flex flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">고객 관리</h1>
                    {activeTab === "leads" && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 bg-green-50 border-green-200">
                            <span className="text-sm font-bold text-green-700">
                                자사몰 유입 고객 {leadsTotal.toLocaleString()}명
                            </span>
                        </div>
                    )}
                    {activeTab === "members" && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 bg-blue-50 border-blue-200">
                            <span className="text-sm font-bold text-blue-700">
                                가입 회원 {customers.length}명
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeTab === "members" && selectedCustomers.length > 0 && (
                        <button onClick={handleDeleteSelected} disabled={deleting} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                            {deleting ? "처리 중..." : `${selectedCustomers.length}명 블랙리스트`}
                        </button>
                    )}
                    <button
                        onClick={() => activeTab === "leads" ? fetchLeads(leadsPage, leadsSearch) : fetchCustomers()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> 새로고침
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab("leads")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "leads" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                    <Database className="w-4 h-4" /> 자사몰 유입 고객 (마케팅 DB)
                </button>
                <button
                    onClick={() => setActiveTab("members")}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "members" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                    <Users className="w-4 h-4" /> 가입 회원
                </button>
            </div>

            {/* ── Tab 1: 자사몰 유입 고객 ── */}
            {activeTab === "leads" && (
                <>
                    <div className="mb-6">
                        <AdminSearch
                            value={leadsSearch}
                            onChange={handleLeadsSearch}
                            placeholder="이름, 전화번호 검색..."
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                        {leadsLoading ? (
                            <div className="p-12 text-center text-gray-400">
                                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                                로딩 중...
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                {leadsSearch ? "검색 결과가 없습니다." : "자사몰 유입 고객 데이터가 없습니다."}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">성별</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생년월일</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {leads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{lead.id}</td>
                                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                                                        <User className="w-3.5 h-3.5 text-green-600" />
                                                    </div>
                                                    {lead.name}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 font-mono">{lead.phone}</td>
                                                <td className="px-4 py-3">{genderBadge(lead.gender)}</td>
                                                <td className="px-4 py-3 text-gray-500">{lead.birth_date || "-"}</td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">
                                                    {[lead.address_sido, lead.address_sigungu].filter(Boolean).join(" ") || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">
                                                    {new Date(lead.created_at).toLocaleDateString("ko-KR")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {leadsTotalPages > 1 && (
                        <Pagination
                            currentPage={leadsPage}
                            totalPages={leadsTotalPages}
                            onPageChange={(p) => { setLeadsPage(p); fetchLeads(p, leadsSearch); }}
                        />
                    )}
                </>
            )}

            {/* ── Tab 2: 가입 회원 (기존) ── */}
            {activeTab === "members" && (
                <>
                    <div className="mb-6">
                        <AdminSearch
                            value={searchTerm}
                            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                            placeholder="고객명, 전화번호 검색..."
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                        {membersLoading ? (
                            <div className="p-12 text-center text-gray-400">
                                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                                로딩 중...
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                {searchTerm ? "검색 결과가 없습니다." : "고객 데이터가 없습니다."}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full hidden md:table text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input type="checkbox"
                                                    checked={selectedCustomers.length === currentCustomers.length && currentCustomers.length > 0}
                                                    onChange={() => selectedCustomers.length === currentCustomers.length ? setSelectedCustomers([]) : setSelectedCustomers(currentCustomers.map(c => c.phone))}
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">최근 주문일</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 주문수</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 결제금액</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상세</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentCustomers.map((customer) => (
                                            <React.Fragment key={customer.id}>
                                                <tr className={`hover:bg-gray-50 transition-colors ${expandedCustomer === customer.id ? "bg-gray-50" : ""}`}>
                                                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input type="checkbox" checked={selectedCustomers.includes(customer.phone)} onChange={() => setSelectedCustomers(prev => prev.includes(customer.phone) ? prev.filter(p => p !== customer.phone) : [...prev, customer.phone])} className="w-4 h-4 rounded border-gray-300 text-red-500" />
                                                    </td>
                                                    <td className="px-4 py-4 cursor-pointer" onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5 font-medium">
                                                                    {customer.name}
                                                                    {customer.isRegistered
                                                                        ? <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded border border-green-200">회원</span>
                                                                        : <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">비회원</span>
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-400">{customer.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-500 font-mono text-sm">{customer.phone}</td>
                                                    <td className="px-4 py-4 text-gray-500">{new Date(customer.lastOrderDate).toLocaleDateString("ko-KR")}</td>
                                                    <td className="px-4 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{customer.totalOrders}건</span></td>
                                                    <td className="px-4 py-4 font-bold">{customer.totalSpent.toLocaleString()}원</td>
                                                    <td className="px-4 py-4 text-gray-400 cursor-pointer" onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}>
                                                        {expandedCustomer === customer.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </td>
                                                </tr>
                                                {expandedCustomer === customer.id && (
                                                    <tr className="bg-gray-50">
                                                        <td colSpan={7} className="px-6 py-4">
                                                            <div className="bg-white rounded border border-gray-200 p-4">
                                                                <h4 className="font-bold mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> 주문 이력</h4>
                                                                {customer.orders.length === 0 ? (
                                                                    <p className="text-sm text-gray-400">주문 내역이 없습니다.</p>
                                                                ) : (
                                                                    <table className="w-full text-sm">
                                                                        <thead className="bg-gray-100"><tr>
                                                                            <th className="px-4 py-2 text-left">주문번호</th>
                                                                            <th className="px-4 py-2 text-left">주문일자</th>
                                                                            <th className="px-4 py-2 text-left">금액</th>
                                                                            <th className="px-4 py-2 text-left">상태</th>
                                                                            <th className="px-4 py-2 text-left">배송지</th>
                                                                        </tr></thead>
                                                                        <tbody className="divide-y divide-gray-100">
                                                                            {customer.orders.map(order => (
                                                                                <tr key={order.id}>
                                                                                    <td className="px-4 py-2 font-mono">{order.order_number}</td>
                                                                                    <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString("ko-KR")}</td>
                                                                                    <td className="px-4 py-2">{order.final_amount.toLocaleString()}원</td>
                                                                                    <td className="px-4 py-2">
                                                                                        <span className={`px-2 py-0.5 rounded text-xs ${order.payment_status === "paid" ? "bg-green-100 text-green-800" : order.payment_status === "shipped" ? "bg-purple-100 text-purple-800" : order.payment_status === "delivered" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                                                                                            {order.payment_status === "paid" && "입금완료"}{order.payment_status === "shipped" && "배송중"}{order.payment_status === "delivered" && "배송완료"}{order.payment_status === "pending" && "입금대기"}{order.payment_status === "cancelled" && "취소"}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-gray-500 truncate max-w-xs">{order.shipping_address} {order.shipping_address_detail}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                )}
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

                    {totalPages > 1 && (
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    )}
                </>
            )}
        </div>
    );
}
