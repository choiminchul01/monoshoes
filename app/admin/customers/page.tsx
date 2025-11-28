"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, User, ShoppingBag, Calendar, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import AdminSearch from "@/components/admin/AdminSearch";
import Pagination from "@/components/ui/Pagination";

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
};

type Customer = {
    id: string; // Use phone number as ID for aggregation
    name: string;
    phone: string;
    address: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    orders: Order[];
};

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data: orders, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (orders) {
                // Group orders by phone number to identify unique customers
                const customerMap = new Map<string, Customer>();

                orders.forEach((order: Order) => {
                    const key = order.shipping_phone;
                    if (!key) return;

                    if (!customerMap.has(key)) {
                        customerMap.set(key, {
                            id: key,
                            name: order.shipping_name,
                            phone: order.shipping_phone,
                            address: `${order.shipping_address} ${order.shipping_address_detail}`,
                            totalOrders: 0,
                            totalSpent: 0,
                            lastOrderDate: order.created_at,
                            orders: []
                        });
                    }

                    const customer = customerMap.get(key)!;
                    customer.totalOrders += 1;
                    // Only count paid/shipped/delivered for total spent
                    if (['paid', 'shipped', 'delivered'].includes(order.payment_status)) {
                        customer.totalSpent += order.final_amount;
                    }
                    customer.orders.push(order);

                    // Update last order date if this order is newer
                    if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
                        customer.lastOrderDate = order.created_at;
                    }
                });

                // Convert map to array and sort by last order date
                const customerList = Array.from(customerMap.values()).sort((a, b) =>
                    new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
                );

                setCustomers(customerList);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            alert("고객 정보를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // Filter customers
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

    // Pagination
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const currentCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const toggleExpand = (phone: string) => {
        if (expandedCustomer === phone) {
            setExpandedCustomer(null);
        } else {
            setExpandedCustomer(phone);
        }
    };

    return (
        <div>
            {/* Title Row with Refresh */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">고객 관리</h1>
                <button
                    onClick={fetchCustomers}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    새로고침
                </button>
            </div>

            {/* Search Row */}
            <div className="mb-6">
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
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
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
                                    <>
                                        <tr
                                            key={customer.id}
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${expandedCustomer === customer.id ? 'bg-gray-50' : ''}`}
                                            onClick={() => toggleExpand(customer.id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                {customer.name}
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
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                                {expandedCustomer === customer.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </td>
                                        </tr>
                                        {expandedCustomer === customer.id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="bg-white rounded border border-gray-200 p-4">
                                                        <h4 className="font-bold mb-3 flex items-center gap-2">
                                                            <ShoppingBag className="w-4 h-4" />
                                                            주문 이력
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
                                    </>
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
