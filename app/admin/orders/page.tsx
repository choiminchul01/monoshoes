"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, RefreshCw, Trash2, Eye, Search, Upload, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ConfirmModal from "@/components/admin/ConfirmModal";
import TrackingNumberModal from "@/components/admin/TrackingNumberModal";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import BulkTrackingModal from "@/components/admin/BulkTrackingModal";
import { useToast } from "@/context/ToastContext";

type Order = {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_name: string;
    shipping_phone: string;
    shipping_postal_code: string;
    shipping_address: string;
    shipping_address_detail: string;
    final_amount: number;
    payment_status: string;
    order_status: string;
    tracking_number?: string;
    shipping_company?: string;
    admin_memo?: string;
    created_at: string;
};

export default function OrdersPage() {
    const toast = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [isMounted, setIsMounted] = useState<boolean>(false);

    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDangerous?: boolean;
    }>({ show: false, title: "", message: "", onConfirm: () => { } });

    const [trackingModal, setTrackingModal] = useState<{
        show: boolean;
        orderId: string;
        orderNumber: string;
    }>({ show: false, orderId: "", orderNumber: "" });

    const [detailModal, setDetailModal] = useState<{
        show: boolean;
        orderId: string;
    }>({ show: false, orderId: "" });

    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            fetchOrders();
        }
    }, [filter, isMounted]);

    const fetchOrders = async () => {
        setLoading(true);
        let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

        if (filter !== "all") {
            query = query.eq("payment_status", filter);
        }

        const { data, error } = await query;

        if (!error && data) {
            setOrders(data as Order[]);
        } else if (error) {
            console.error("주문 조회 실패:", error);
            toast.error("주문 목록을 불러오는데 실패했습니다.");
        }
        setLoading(false);
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        );
    };

    const toggleSelectAll = () => {
        const filteredOrders = getFilteredOrders();
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map((o) => o.id));
        }
    };

    const getFilteredOrders = () => {
        if (!searchQuery.trim()) return orders;

        const query = searchQuery.toLowerCase();
        return orders.filter(
            (order) =>
                order.order_number.toLowerCase().includes(query) ||
                order.customer_name.toLowerCase().includes(query) ||
                order.shipping_name.toLowerCase().includes(query) ||
                order.customer_phone.includes(query) ||
                order.shipping_phone.includes(query)
        );
    };

    const updatePaymentStatus = async (orderId: string, status: string) => {
        const { error } = await supabase
            .from("orders")
            .update({ payment_status: status })
            .eq("id", orderId);

        if (!error) {
            toast.success("주문 상태가 변경되었습니다.");
            await fetchOrders();
            setSelectedOrders([]);
        } else {
            console.error("상태 업데이트 실패:", error);
            toast.error(`상태 업데이트 실패: ${error.message}`);
        }
    };

    const bulkPaymentConfirmation = async () => {
        let success = 0;
        let fail = 0;
        const errorMessages: string[] = [];

        for (const id of selectedOrders) {
            const { error } = await supabase
                .from("orders")
                .update({ payment_status: "paid" })
                .eq("id", id);

            if (error) {
                fail++;
                errorMessages.push(`주문 ID (${id.substring(0, 8)}...): ${error.message}`);
                console.error("입금 확인 실패:", id, error);
            } else {
                success++;
            }
        }

        if (fail > 0) {
            console.error("일괄 입금 확인 실패 목록:", errorMessages);
            toast.warning(`${success}건 성공, ${fail}건 실패했습니다.`);
        } else {
            toast.success(`${success}건의 입금 확인이 완료되었습니다.`);
        }

        await fetchOrders();
        setSelectedOrders([]);
    };

    const handleTrackingNumberSubmit = async (trackingNumber: string, shippingCompany: string) => {
        const { error } = await supabase
            .from("orders")
            .update({
                tracking_number: trackingNumber,
                shipping_company: shippingCompany,
                payment_status: "shipped",
            })
            .eq("id", trackingModal.orderId);

        if (!error) {
            toast.success("송장번호가 입력되고 배송중 상태로 변경되었습니다.");
            await fetchOrders();
        } else {
            console.error("송장 입력 실패:", error);
            toast.error(`송장 입력 실패: ${error.message}`);
        }

        setTrackingModal({ show: false, orderId: "", orderNumber: "" });
    };

    const deleteOrder = async (orderId: string) => {
        try {
            // 1. 주문 상품 먼저 삭제 시도 (FK 제약 조건 방지)
            const { error: itemsError } = await supabase
                .from("order_items")
                .delete()
                .eq("order_id", orderId);

            // 아이템 삭제 에러가 있어도 주문 삭제를 시도해봄 (CASCADE가 설정되어 있을 수 있으므로)
            if (itemsError) {
                console.warn("주문 상품 삭제 경고 (CASCADE가 처리할 수도 있음):", itemsError);
            }

            // 2. 주문 삭제
            const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId);
            if (orderError) throw orderError;

            return { success: true };
        } catch (e: any) {
            console.error("주문 삭제 실패:", e);
            return { success: false, message: e.message || "알 수 없는 오류" };
        }
    };

    const deleteSelectedOrders = async () => {
        let success = 0;
        let fail = 0;
        let lastError = "";

        for (const id of selectedOrders) {
            const result = await deleteOrder(id);
            if (result.success) {
                success++;
            } else {
                fail++;
                lastError = result.message || "알 수 없는 오류";
            }
        }

        if (fail > 0) {
            toast.warning(`${success}건 삭제 완료, ${fail}건 실패. (사유: ${lastError})`);
        } else {
            toast.success(`${success}건의 주문이 삭제되었습니다.`);
        }

        setSelectedOrders([]);
        await fetchOrders();
    };

    const exportToExcel = () => {
        const exportData = getFilteredOrders().map((order) => ({
            주문번호: order.order_number,
            주문일시: new Date(order.created_at).toLocaleString("ko-KR"),
            받는분: order.shipping_name,
            연락처: order.shipping_phone,
            우편번호: order.shipping_postal_code,
            주소: order.shipping_address,
            상세주소: order.shipping_address_detail,
            주문금액: order.final_amount,
            결제상태: order.payment_status,
            송장번호: order.tracking_number || "",
            택배사: order.shipping_company || "",
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "주문목록");
        ws["!cols"] = Array(11).fill({ wch: 15 });

        const fileName = `주문목록_${new Date().toISOString().split("T")[0]}.xlsx`;
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, fileName);
        toast.success("엑셀 파일이 다운로드되었습니다.");
    };

    if (!isMounted) return null;

    const filteredOrders = getFilteredOrders();
    const pendingCount = orders.filter(order => order.payment_status === 'pending').length;

    return (
        <div>
            {/* Title Row with Notification and Refresh */}
            <div className="flex flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">주문 관리</h1>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${pendingCount > 0
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        <span className={`text-sm font-bold ${pendingCount > 0
                            ? 'text-yellow-700'
                            : 'text-gray-500'
                            }`}>
                            입금대기 {pendingCount}건
                        </span>
                    </div>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </button>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                    onClick={exportToExcel}
                    className="flex items-center justify-center gap-2 px-4 py-3 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    엑셀 내보내기
                </button>
                <button
                    onClick={() => setShowBulkModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    운송장 일괄 업로드
                </button>
            </div>

            {/* Search Row */}
            <div className="mb-8 mt-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="주문번호, 고객명, 전화번호로 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                {["all", "pending", "paid", "shipped", "delivered"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${filter === status
                            ? "bg-green-100 text-green-900 border border-green-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {status === "all" && "전체"}
                        {status === "pending" && "입금대기"}
                        {status === "paid" && "입금완료"}
                        {status === "shipped" && "배송중"}
                        {status === "delivered" && "배송완료"}
                    </button>
                ))}
            </div>

            {selectedOrders.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-blue-900">
                                {selectedOrders.length}개의 주문이 선택되었습니다
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                선택된 주문에 대한 일괄 작업을 수행할 수 있습니다
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedOrders([])}
                                className="px-4 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                선택 해제
                            </button>
                            <button
                                onClick={() =>
                                    setConfirmModal({
                                        show: true,
                                        title: "일괄 입금 확인",
                                        message: `선택한 ${selectedOrders.length}건의 주문을 입금 완료 처리하시겠습니까?\n\n주문 목록에서 선택된 주문들이 모두 "입금완료" 상태로 변경됩니다.`,
                                        onConfirm: bulkPaymentConfirmation,
                                    })
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                일괄 입금 확인
                            </button>
                            <button
                                onClick={() =>
                                    setConfirmModal({
                                        show: true,
                                        title: "⚠️ 주문 삭제 경고",
                                        message: `정말로 선택한 ${selectedOrders.length}건의 주문을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.\n⚠️ 주문 및 관련된 모든 데이터가 영구적으로 삭제됩니다.`,
                                        onConfirm: deleteSelectedOrders,
                                        isDangerous: true,
                                    })
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <Trash2 className="w-4 h-4" />
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-green-600" />
                        <p>주문 내역을 불러오는 중입니다...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchQuery ? "검색 결과가 없습니다" : "주문 내역이 없습니다"}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full hidden md:table">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-green-600 border-gray-300 rounded"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문번호</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주문일</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">다음 단계</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => toggleOrderSelection(order.id)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.order_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.shipping_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.shipping_phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.final_amount.toLocaleString()}원</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${order.payment_status === "delivered"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : order.payment_status === "shipped"
                                                        ? "bg-purple-100 text-purple-800"
                                                        : order.payment_status === "paid"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                            >
                                                {order.payment_status === "pending" && "입금대기"}
                                                {order.payment_status === "paid" && "입금완료"}
                                                {order.payment_status === "shipped" && "배송중"}
                                                {order.payment_status === "delivered" && "배송완료"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString("ko-KR")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setDetailModal({ show: true, orderId: order.id })}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="상세보기"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {order.payment_status === "pending" && (
                                                    <button
                                                        onClick={() =>
                                                            setConfirmModal({
                                                                show: true,
                                                                title: "입금 확인",
                                                                message: `주문번호: ${order.order_number}\n고객명: ${order.shipping_name}\n금액: ${order.final_amount.toLocaleString()}원\n\n입금을 확인하셨습니까?`,
                                                                onConfirm: () => updatePaymentStatus(order.id, "paid"),
                                                            })
                                                        }
                                                        className="text-green-600 hover:text-green-900 hover:bg-green-50 hover:underline font-medium px-3 py-1.5 rounded transition-all duration-200 hover:scale-105 cursor-pointer"
                                                    >
                                                        입금 확인
                                                    </button>
                                                )}

                                                {order.payment_status === "paid" && (
                                                    <button
                                                        onClick={() =>
                                                            setTrackingModal({
                                                                show: true,
                                                                orderId: order.id,
                                                                orderNumber: order.order_number,
                                                            })
                                                        }
                                                        className="text-purple-600 hover:text-purple-900 hover:bg-purple-50 hover:underline font-medium px-3 py-1.5 rounded transition-all duration-200 hover:scale-105 cursor-pointer"
                                                    >
                                                        송장 입력
                                                    </button>
                                                )}

                                                {order.payment_status === "shipped" && (
                                                    <button
                                                        onClick={() =>
                                                            setConfirmModal({
                                                                show: true,
                                                                title: "배송 완료 처리",
                                                                message: `주문번호: ${order.order_number}\n\n배송이 완료되었습니까?\n배송 완료 후에는 반품/교환 처리가 제한될 수 있습니다.`,
                                                                onConfirm: () => updatePaymentStatus(order.id, "delivered"),
                                                            })
                                                        }
                                                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 hover:underline font-medium px-3 py-1.5 rounded transition-all duration-200 hover:scale-105 cursor-pointer"
                                                    >
                                                        배송 완료
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <div key={order.id} className="p-4 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => toggleOrderSelection(order.id)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded"
                                            />
                                            <span className="font-bold text-gray-900">{order.shipping_name}</span>
                                        </div>
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${order.payment_status === "delivered"
                                                ? "bg-blue-100 text-blue-800"
                                                : order.payment_status === "shipped"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : order.payment_status === "paid"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {order.payment_status === "pending" && "입금대기"}
                                            {order.payment_status === "paid" && "입금완료"}
                                            {order.payment_status === "shipped" && "배송중"}
                                            {order.payment_status === "delivered" && "배송완료"}
                                        </span>
                                    </div>

                                    <div className="mb-3 text-sm text-gray-600 space-y-1 pl-6">
                                        <div className="flex justify-between">
                                            <span>주문번호:</span>
                                            <span className="font-mono">{order.order_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>금액:</span>
                                            <span className="font-bold text-gray-900">{order.final_amount.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>주문일:</span>
                                            <span>{new Date(order.created_at).toLocaleDateString("ko-KR")}</span>
                                        </div>
                                        {order.tracking_number && (
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>송장:</span>
                                                <span>{order.shipping_company} {order.tracking_number}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2 pl-6">
                                        <button
                                            onClick={() => setDetailModal({ show: true, orderId: order.id })}
                                            className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            상세보기
                                        </button>

                                        {order.payment_status === "pending" && (
                                            <button
                                                onClick={() =>
                                                    setConfirmModal({
                                                        show: true,
                                                        title: "입금 확인",
                                                        message: `주문번호: ${order.order_number}\n고객명: ${order.shipping_name}\n금액: ${order.final_amount.toLocaleString()}원\n\n입금을 확인하셨습니까?`,
                                                        onConfirm: () => updatePaymentStatus(order.id, "paid"),
                                                    })
                                                }
                                                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 hover:underline transition-all duration-200 hover:scale-105 cursor-pointer hover:shadow-md"
                                            >
                                                입금확인
                                            </button>
                                        )}

                                        {order.payment_status === "paid" && (
                                            <button
                                                onClick={() =>
                                                    setTrackingModal({
                                                        show: true,
                                                        orderId: order.id,
                                                        orderNumber: order.order_number,
                                                    })
                                                }
                                                className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 hover:underline transition-all duration-200 hover:scale-105 cursor-pointer hover:shadow-md"
                                            >
                                                송장입력
                                            </button>
                                        )}

                                        {order.payment_status === "shipped" && (
                                            <button
                                                onClick={() =>
                                                    setConfirmModal({
                                                        show: true,
                                                        title: "배송 완료 처리",
                                                        message: `주문번호: ${order.order_number}\n\n배송이 완료되었습니까?\n배송 완료 후에는 반품/교환 처리가 제한될 수 있습니다.`,
                                                        onConfirm: () => updatePaymentStatus(order.id, "delivered"),
                                                    })
                                                }
                                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 hover:underline transition-all duration-200 hover:scale-105 cursor-pointer hover:shadow-md"
                                            >
                                                배송완료
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.show}
                onClose={() => setConfirmModal({ ...confirmModal, show: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDangerous={confirmModal.isDangerous}
            />

            <TrackingNumberModal
                isOpen={trackingModal.show}
                onClose={() => setTrackingModal({ show: false, orderId: "", orderNumber: "" })}
                onConfirm={handleTrackingNumberSubmit}
                orderNumber={trackingModal.orderNumber}
            />

            <OrderDetailModal
                isOpen={detailModal.show}
                onClose={() => setDetailModal({ show: false, orderId: "" })}
                orderId={detailModal.orderId}
            />

            <BulkTrackingModal
                isOpen={showBulkModal}
                onClose={() => setShowBulkModal(false)}
                onSuccess={fetchOrders}
            />
        </div>
    );
}
