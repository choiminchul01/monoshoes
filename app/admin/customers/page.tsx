"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, ShoppingBag, ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";

import { fetchAllUsersAction } from "./actions";

type Order = {
    id: string;
    created_at: string;
    order_number: string;
    final_amount: number;
    payment_status: string;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_address_detail: string;
    customer_email?: string;
    user_id?: string;
};

type Customer = {
    id: string;
    email: string;
    name: string;
    phone: string;
    address: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    orders: Order[];
    isRegistered: boolean;
};

export default function AdminCustomersPage() {
    const toast = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // 1. 전체 가입 유저 가져오기 (서버 액션)
            const usersResult = await fetchAllUsersAction();
            const allRegisteredUsers = usersResult.success ? usersResult.users : [];

            // 2. 전체 주문 데이터 가져오기
            const { data: orders, error: ordersError } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (ordersError) throw ordersError;

            // 3. 블랙리스트 조회
            const { data: blacklist } = await supabase
                .from("blacklisted_customers")
                .select("phone");
            const blacklistedPhones = new Set(blacklist?.map(b => b.phone) || []);

            const customerMap = new Map<string, Customer>();

            // 가입 유저 먼저 맵에 등록 (주문이 없어도 보이게 함)
            allRegisteredUsers?.forEach(user => {
                // 블랙리스트 제외
                if (user.phone && blacklistedPhones.has(user.phone)) return;

                customerMap.set(user.email, {
                    id: user.id,
                    email: user.email || "",
                    name: user.name,
                    phone: user.phone,
                    address: user.address ? `${user.address} ${user.address_detail}` : "",
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: user.created_at, // 가입일로 초기화
                    orders: [],
                    isRegistered: true
                });
            });

            // 주문 데이터를 가입 유저에게 매칭하거나 비회원으로 추가
            orders?.forEach((order: any) => {
                const emailKey = order.customer_email;
                const phoneKey = order.shipping_phone;

                // 블랙리스트 고객 제외
                if (phoneKey && blacklistedPhones.has(phoneKey)) return;

                let customer: Customer | undefined;

                // 1차: 이메일로 매칭 (회원)
                if (emailKey && customerMap.has(emailKey)) {
                    customer = customerMap.get(emailKey);
                } 
                // 2차: 이메일이 없거나 못 찾았으면 전화번호로 찾기 (비회원 또는 정보 불일치 회원)
                else if (phoneKey) {
                    // 이미 다른 이메일로 등록된 폰번호가 있는지 확인
                    const existingByPhone = Array.from(customerMap.values()).find(c => c.phone === phoneKey);
                    if (existingByPhone) {
                        customer = existingByPhone;
                    } else {
                        // 완전히 새로운 비회원 고객 생성
                        customer = {
                            id: phoneKey, // 비회원은 전화번호를 ID로 사용
                            email: emailKey || "",
                            name: order.shipping_name,
                            phone: phoneKey,
                            address: `${order.shipping_address} ${order.shipping_address_detail}`,
                            totalOrders: 0,
                            totalSpent: 0,
                            lastOrderDate: order.created_at,
                            orders: [],
                            isRegistered: false
                        };
                        customerMap.set(phoneKey, customer);
                    }
                }

                if (customer) {
                    customer.totalOrders += 1;
                    if (['paid', 'shipped', 'delivered'].includes(order.payment_status)) {
                        customer.totalSpent += order.final_amount;
                    }
                    customer.orders.push(order);

                    // 최근 활동일 업데이트
                    if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
                        customer.lastOrderDate = order.created_at;
                    }
                }
            });

            // 정렬: 최근 활동(가입 또는 주문) 순
            const customerList = Array.from(customerMap.values()).sort((a, b) =>
                new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
            );

            setCustomers(customerList);
            setSelectedCustomers([]);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (phone: string) => {
        setSelectedCustomers(prev =>
            prev.includes(phone)
                ? prev.filter(p => p !== phone)
                : [...prev, phone]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCustomers.length === currentCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(currentCustomers.map(c => c.phone));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedCustomers.length === 0) {
            toast.error("삭제할 고객을 선택해주세요.");
            return;
        }

        const confirmed = window.confirm(
            `선택한 ${selectedCustomers.length}명의 고객을 블랙리스트에 추가하시겠습니까?\n\n블랙리스트에 추가된 고객은 더 이상 목록에 표시되지 않습니다.`
        );

        if (!confirmed) return;

        setDeleting(true);
        try {
            const customersToBlock = customers.filter(c => selectedCustomers.includes(c.phone));

            const { error } = await supabase
                .from("blacklisted_customers")
                .insert(
                    customersToBlock.map(c => ({
                        phone: c.phone,
                        name: c.name,
                        reason: "관리자에 의해 차단됨"
                    }))
                );

            if (error) throw error;

            toast.success(`${selectedCustomers.length}명의 고객이 블랙리스트에 추가되었습니다.`);
            setSelectedCustomers([]);
            await fetchCustomers();
        } catch (error) {
            console.error("Error blocking customers:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        } finally {
            setDeleting(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const currentCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleExpand = (phone: string) => {
        setExpandedCustomer(expandedCustomer === phone ? null : phone);
    };

    return (
        <div>
            {/* Title Row */}
            <div className="flex flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">고객 관리</h1>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 bg-blue-50 border-blue-200">
                        <span className="text-sm font-bold text-blue-700">
                            총 고객 {customers.length}명
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedCustomers.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? "처리 중..." : `${selectedCustomers.length}명 블랙리스트 추가`}
                        </button>
                    )}
                    <button
                        onClick={fetchCustomers}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-8 mt-4">
                <AdminSearch
                    value={searchTerm}
                    onChange={(val) => {
                        setSearchTerm(val);
                        setCurrentPage(1);
                    }}
                    placeholder="고객명, 전화번호 검색..."
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">로딩 중...</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchTerm ? "검색 결과가 없습니다" : "고객 데이터가 없습니다"}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4 p-4 bg-gray-50">
                            {currentCustomers.map((customer) => (
                                <div key={customer.id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedCustomers.includes(customer.phone)}
                                                onChange={() => toggleSelect(customer.phone)}
                                                className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                                            />
                                            <div>
                                                <h3 className="font-bold text-lg flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    {customer.name}
                                                    {customer.isRegistered ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded border border-green-200">회원</span>
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">비회원</span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">{customer.phone}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                            주문 {customer.totalOrders}건
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="text-gray-500 block text-xs">총 결제금액</span>
                                            <span className="font-bold">{customer.totalSpent.toLocaleString()}원</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="text-gray-500 block text-xs">최근 주문일</span>
                                            <span>{new Date(customer.lastOrderDate).toLocaleDateString("ko-KR")}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleExpand(customer.id)}
                                        className="w-full flex items-center justify-center gap-1 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded transition-colors border border-gray-200"
                                    >
                                        {expandedCustomer === customer.id ? (
                                            <>접기 <ChevronUp className="w-4 h-4" /></>
                                        ) : (
                                            <>주문 내역 보기 <ChevronDown className="w-4 h-4" /></>
                                        )}
                                    </button>
                                    {expandedCustomer === customer.id && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                <ShoppingBag className="w-3 h-3" /> 주문 이력
                                            </h4>
                                            <div className="space-y-2">
                                                {customer.orders.map(order => (
                                                    <div key={order.id} className="bg-gray-50 p-3 rounded text-sm">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="font-mono text-xs">{order.order_number}</span>
                                                            <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("ko-KR")}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold">{order.final_amount.toLocaleString()}원</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                    order.payment_status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                                        order.payment_status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {order.payment_status === 'paid' && '입금완료'}
                                                                {order.payment_status === 'shipped' && '배송중'}
                                                                {order.payment_status === 'delivered' && '배송완료'}
                                                                {order.payment_status === 'pending' && '입금대기'}
                                                                {order.payment_status === 'cancelled' && '취소'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Desktop View */}
                        <table className="w-full hidden md:table">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedCustomers.length === currentCustomers.length && currentCustomers.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">최근 주문일</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 주문수</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 결제금액</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상세</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentCustomers.map((customer) => (
                                    <React.Fragment key={customer.id}>
                                        <tr className={`hover:bg-gray-50 transition-colors ${expandedCustomer === customer.id ? 'bg-gray-50' : ''}`}>
                                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCustomers.includes(customer.phone)}
                                                    onChange={() => toggleSelect(customer.phone)}
                                                    className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(customer.id)}>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        {customer.name}
                                                        {customer.isRegistered ? (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded border border-green-200">회원</span>
                                                        ) : (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">비회원</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-normal">{customer.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{customer.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {new Date(customer.lastOrderDate).toLocaleDateString("ko-KR")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                    {customer.totalOrders}건
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-bold">
                                                {customer.totalSpent.toLocaleString()}원
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-400 cursor-pointer" onClick={() => toggleExpand(customer.id)}>
                                                {expandedCustomer === customer.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </td>
                                        </tr>
                                        {expandedCustomer === customer.id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div className="bg-white rounded border border-gray-200 p-4">
                                                        <h4 className="font-bold mb-3 flex items-center gap-2">
                                                            <ShoppingBag className="w-4 h-4" /> 주문 이력
                                                        </h4>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left">주문번호</th>
                                                                        <th className="px-4 py-2 text-left">주문일자</th>
                                                                        <th className="px-4 py-2 text-left">금액</th>
                                                                        <th className="px-4 py-2 text-left">상태</th>
                                                                        <th className="px-4 py-2 text-left">배송지</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {customer.orders.map(order => (
                                                                        <tr key={order.id}>
                                                                            <td className="px-4 py-2 font-mono">{order.order_number}</td>
                                                                            <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString("ko-KR")}</td>
                                                                            <td className="px-4 py-2">{order.final_amount.toLocaleString()}원</td>
                                                                            <td className="px-4 py-2">
                                                                                <span className={`px-2 py-0.5 rounded text-xs ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                                                        order.payment_status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                                                            order.payment_status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                                                                                                'bg-yellow-100 text-yellow-800'
                                                                                    }`}>
                                                                                    {order.payment_status === 'paid' && '입금완료'}
                                                                                    {order.payment_status === 'shipped' && '배송중'}
                                                                                    {order.payment_status === 'delivered' && '배송완료'}
                                                                                    {order.payment_status === 'pending' && '입금대기'}
                                                                                    {order.payment_status === 'cancelled' && '취소'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-2 text-gray-500 truncate max-w-xs">
                                                                                {order.shipping_address} {order.shipping_address_detail}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
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

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
