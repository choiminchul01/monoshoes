"use client";

import { useState } from "react";
import { Download, RefreshCw, Trash2, Eye, Search, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ConfirmModal from "@/components/admin/ConfirmModal";
import TrackingNumberModal from "@/components/admin/TrackingNumberModal";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import BulkTrackingModal from "@/components/admin/BulkTrackingModal";
import OrderEditModal from "@/components/admin/OrderEditModal";
import OrderPreparingCard from "@/components/admin/OrderPreparingCard";
import { useToast } from "@/context/ToastContext";

// ── 임의 고정값 Mock 주문 데이터 (천원 단위 현실 가격, 5만원 이상 무료배송) ──
const MOCK_ORDERS = [
    { id: '1',  order_number: 'ORD-20260429-0841', customer_name: '김민지', customer_email: 'minji@email.com', customer_phone: '010-3847-2916', shipping_name: '김민지', shipping_phone: '010-3847-2916', shipping_postal_code: '06234', shipping_address: '서울 강남구 테헤란로 123', shipping_address_detail: '101호', total_amount: 86500,  shipping_cost: 3000, final_amount: 89500,  payment_status: 'pending',   order_status: 'pending',   tracking_number: '', shipping_company: '', admin_memo: '', created_at: '2026-04-29T08:41:00Z' },
    { id: '2',  order_number: 'ORD-20260429-0723', customer_name: '이서연', customer_email: 'seoyeon@email.com', customer_phone: '010-7231-5084', shipping_name: '이서연', shipping_phone: '010-7231-5084', shipping_postal_code: '04524', shipping_address: '서울 중구 명동길 45', shipping_address_detail: '302호', total_amount: 147200, shipping_cost: 0,    final_amount: 147200, payment_status: 'pending',   order_status: 'pending',   tracking_number: '', shipping_company: '', admin_memo: '', created_at: '2026-04-29T07:23:00Z' },
    { id: '3',  order_number: 'ORD-20260429-0612', customer_name: '박준혁', customer_email: 'junhyuk@email.com', customer_phone: '010-9563-1728', shipping_name: '박준혁', shipping_phone: '010-9563-1728', shipping_postal_code: '48058', shipping_address: '부산 해운대구 해운대로 200', shipping_address_detail: '', total_amount: 63800,  shipping_cost: 0,    final_amount: 63800,  payment_status: 'pending',   order_status: 'pending',   tracking_number: '', shipping_company: '', admin_memo: '', created_at: '2026-04-29T06:12:00Z' },
    { id: '4',  order_number: 'ORD-20260428-2247', customer_name: '최유나', customer_email: 'yuna@email.com', customer_phone: '010-4819-6302', shipping_name: '최유나', shipping_phone: '010-4819-6302', shipping_postal_code: '61452', shipping_address: '광주 남구 봉선로 88', shipping_address_detail: '201호', total_amount: 118500, shipping_cost: 0,    final_amount: 118500, payment_status: 'paid',      order_status: 'paid',      tracking_number: '', shipping_company: '', admin_memo: '', created_at: '2026-04-28T22:47:00Z' },
    { id: '5',  order_number: 'ORD-20260428-1952', customer_name: '정다은', customer_email: 'daeun@email.com', customer_phone: '010-6074-3851', shipping_name: '정다은', shipping_phone: '010-6074-3851', shipping_postal_code: '35233', shipping_address: '대전 유성구 대학로 99', shipping_address_detail: '5층', total_amount: 31900,  shipping_cost: 3000, final_amount: 34900,  payment_status: 'paid',      order_status: 'paid',      tracking_number: '', shipping_company: '', admin_memo: '', created_at: '2026-04-28T19:52:00Z' },
    { id: '6',  order_number: 'ORD-20260428-1637', customer_name: '한지수', customer_email: 'jisu@email.com', customer_phone: '010-2395-8147', shipping_name: '한지수', shipping_phone: '010-2395-8147', shipping_postal_code: '03048', shipping_address: '서울 종로구 인사동길 12', shipping_address_detail: '302호', total_amount: 156300, shipping_cost: 0,    final_amount: 156300, payment_status: 'paid',      order_status: 'paid',      tracking_number: '', shipping_company: '', admin_memo: '', created_at: '2026-04-28T16:37:00Z' },
    { id: '7',  order_number: 'ORD-20260428-1423', customer_name: '오승민', customer_email: 'seungmin@email.com', customer_phone: '010-8162-4739', shipping_name: '오승민', shipping_phone: '010-8162-4739', shipping_postal_code: '22344', shipping_address: '인천 연수구 송도대로 300', shipping_address_detail: '', total_amount: 79800,  shipping_cost: 0,    final_amount: 79800,  payment_status: 'preparing', order_status: 'preparing', tracking_number: '', shipping_company: '', admin_memo: '', created_at: '2026-04-28T14:23:00Z' },
    { id: '8',  order_number: 'ORD-20260428-1124', customer_name: '윤채원', customer_email: 'chaewon@email.com', customer_phone: '010-5927-0483', shipping_name: '윤채원', shipping_phone: '010-5927-0483', shipping_postal_code: '41939', shipping_address: '대구 중구 동성로 55', shipping_address_detail: '4층', total_amount: 95700,  shipping_cost: 0,    final_amount: 95700,  payment_status: 'preparing', order_status: 'preparing', tracking_number: '', shipping_company: '', admin_memo: '', created_at: '2026-04-28T11:24:00Z' },
    { id: '9',  order_number: 'ORD-20260427-1834', customer_name: '강수아', customer_email: 'sua@email.com', customer_phone: '010-1648-9275', shipping_name: '강수아', shipping_phone: '010-1648-9275', shipping_postal_code: '16480', shipping_address: '경기 수원시 팔달구 인계로 77', shipping_address_detail: '101동 502호', total_amount: 42500,  shipping_cost: 3000, final_amount: 45500,  payment_status: 'shipped',   order_status: 'shipped',   tracking_number: '553928471029', shipping_company: 'CJ대한통운', admin_memo: '', created_at: '2026-04-27T18:34:00Z' },
    { id: '10', order_number: 'ORD-20260427-1501', customer_name: '임도현', customer_email: 'dohyun@email.com', customer_phone: '010-7483-2061', shipping_name: '임도현', shipping_phone: '010-7483-2061', shipping_postal_code: '14059', shipping_address: '경기 안양시 동안구 평촌대로 120', shipping_address_detail: '', total_amount: 132800, shipping_cost: 0,    final_amount: 132800, payment_status: 'shipped',   order_status: 'shipped',   tracking_number: '662103948201', shipping_company: '롯데택배', admin_memo: '', created_at: '2026-04-27T15:01:00Z' },
    { id: '11', order_number: 'ORD-20260427-1022', customer_name: '신예린', customer_email: 'yerin@email.com', customer_phone: '010-3056-7814', shipping_name: '신예린', shipping_phone: '010-3056-7814', shipping_postal_code: '07236', shipping_address: '서울 영등포구 여의대로 10', shipping_address_detail: '1102호', total_amount: 88400,  shipping_cost: 0,    final_amount: 88400,  payment_status: 'shipped',   order_status: 'shipped',   tracking_number: '774018293048', shipping_company: '우체국택배', admin_memo: '', created_at: '2026-04-27T10:22:00Z' },
];



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
    total_amount: number;
    shipping_cost: number;
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
    const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS as Order[]);
    const [loading, setLoading] = useState<boolean>(false);
    const [filter, setFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

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

    const [editModal, setEditModal] = useState<{
        show: boolean;
        orderId: string;
        orderNumber: string;
    }>({ show: false, orderId: "", orderNumber: "" });

    const [showBulkModal, setShowBulkModal] = useState(false);

    // Mock: 새로고침 시 원래 데이터로 복원
    const fetchOrders = () => {
        setLoading(true);
        setTimeout(() => {
            setOrders(MOCK_ORDERS as Order[]);
            setSelectedOrders([]);
            setLoading(false);
            toast.success("주문 목록을 새로고침했습니다.");
        }, 500);
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
        let result = orders;
        if (filter !== "all") {
            result = result.filter(o => o.payment_status === filter);
        }
        if (!searchQuery.trim()) return result;
        const q = searchQuery.toLowerCase();
        return result.filter(
            (order) =>
                order.order_number.toLowerCase().includes(q) ||
                order.customer_name.toLowerCase().includes(q) ||
                order.shipping_name.toLowerCase().includes(q) ||
                order.customer_phone.includes(q) ||
                order.shipping_phone.includes(q)
        );
    };

    // Mock: 로컬 state에서 상태 변경
    const updatePaymentStatus = (orderId: string, status: string) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: status, order_status: status } : o));
        toast.success("주문 상태가 변경되었습니다.");
        setSelectedOrders([]);
    };

    const bulkPaymentConfirmation = () => {
        setOrders(prev => prev.map(o => selectedOrders.includes(o.id) ? { ...o, payment_status: 'paid', order_status: 'paid' } : o));
        toast.success(`${selectedOrders.length}건의 입금 확인이 완료되었습니다.`);
        setSelectedOrders([]);
    };

    const handleTrackingNumberSubmit = (trackingNumber: string, shippingCompany: string) => {
        setOrders(prev => prev.map(o => o.id === trackingModal.orderId
            ? { ...o, tracking_number: trackingNumber, shipping_company: shippingCompany, payment_status: 'shipped', order_status: 'shipped' }
            : o
        ));
        toast.success("송장번호가 입력되고 발송완료 상태로 변경되었습니다.");
        setTrackingModal({ show: false, orderId: "", orderNumber: "" });
    };

    const deleteSelectedOrders = () => {
        setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)));
        toast.success(`${selectedOrders.length}건의 주문이 삭제되었습니다.`);
        setSelectedOrders([]);
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

    const filteredOrders = getFilteredOrders();
    const pendingCount = orders.filter(order => order.payment_status === 'pending').length;



    return (
        <div>
            {/* Title Row */}
            <div className="flex flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">주문 관리</h1>
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-full">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="text-xs font-medium">입금대기 {pendingCount}건</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-500 rounded-xl hover:border-gray-900 hover:text-gray-900 transition-colors text-sm"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    엑셀 내보내기
                </button>
                <button
                    onClick={() => setShowBulkModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    운송장 일괄 업로드
                </button>
            </div>

            {/* Search */}
            <div className="mb-5">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                        type="text"
                        placeholder="주문번호, 고객명, 전화번호로 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 mb-5">
                {[
                    { key: "all",       label: "전체" },
                    { key: "pending",   label: "입금대기" },
                    { key: "paid",      label: "입금완료" },
                    { key: "preparing", label: "상품준비중" },
                    { key: "shipped",   label: "발송완료" },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            filter === key
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-500 hover:text-gray-900"
                        }`}
                    >
                        {label}
                        {key !== "all" && (
                            <span className={`ml-1.5 text-xs ${filter === key ? "text-gray-400" : "text-gray-300"}`}>
                                {orders.filter(o => o.payment_status === key).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {selectedOrders.length > 0 && (
                <div className="mb-4 p-4 bg-gray-900 text-white rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-white text-gray-900 text-xs font-black rounded-full flex items-center justify-center">{selectedOrders.length}</span>
                        <p className="text-sm font-medium">건 선택됨</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedOrders([])} className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">선택 해제</button>
                        <button
                            onClick={() => setConfirmModal({ show: true, title: "일괄 입금 확인", message: `선택한 ${selectedOrders.length}건을 입금 완료 처리하시겠습니까?`, onConfirm: bulkPaymentConfirmation })}
                            className="px-3 py-1.5 text-xs bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                        >일괄 입금 확인</button>
                        <button
                            onClick={() => setConfirmModal({ show: true, title: "주문 삭제", message: `선택한 ${selectedOrders.length}건을 삭제하시겠습니까?`, onConfirm: deleteSelectedOrders, isDangerous: true })}
                            className="px-3 py-1.5 text-xs bg-white/10 text-white rounded-lg hover:bg-red-500 flex items-center gap-1 transition-colors"
                        ><Trash2 className="w-3 h-3" />삭제</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center text-gray-300">
                        <RefreshCw className="w-6 h-6 animate-spin mb-3" />
                        <p className="text-sm">불러오는 중...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-16 text-center text-gray-300 text-sm">
                        {searchQuery ? "검색 결과가 없습니다" : "주문 내역이 없습니다"}
                    </div>
                ) : filter === "preparing" ? (
                    <div className="p-4 space-y-3">
                        {filteredOrders.map((order) => (
                            <OrderPreparingCard
                                key={order.id}
                                order={order}
                                onStatusChange={updatePaymentStatus}
                                onTrackingInput={(orderId, orderNumber) =>
                                    setTrackingModal({ show: true, orderId, orderNumber })
                                }
                                onRefresh={fetchOrders}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full hidden md:table">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-5 py-3.5 text-left w-10">
                                        <input type="checkbox" checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-gray-900 rounded" />
                                    </th>
                                    {["주문번호","고객명","연락처","금액","상태","주문일","처리"].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 tracking-wider uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order) => {
                                    const stMap: Record<string,{label:string;dot:string}> = {
                                        pending:   {label:"입금대기",   dot:"bg-gray-300"},
                                        paid:      {label:"입금완료",   dot:"bg-gray-900"},
                                        preparing: {label:"상품준비중", dot:"bg-gray-600"},
                                        shipped:   {label:"발송완료",   dot:"bg-gray-400"},
                                    };
                                    const st = stMap[order.payment_status] ?? {label:order.payment_status, dot:"bg-gray-200"};
                                    return (
                                        <tr key={order.id} className={`hover:bg-gray-50/60 transition-colors ${selectedOrders.includes(order.id) ? 'bg-gray-50' : ''}`}>
                                            <td className="px-5 py-4">
                                                <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} className="w-4 h-4 accent-gray-900 rounded" />
                                            </td>
                                            <td className="px-5 py-4 text-xs font-mono text-gray-400 whitespace-nowrap">{order.order_number}</td>
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{order.shipping_name}</td>
                                            <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">{order.shipping_phone}</td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900 tabular-nums">{order.final_amount.toLocaleString()}</span>
                                                <span className="text-xs text-gray-400">원</span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                    <span className="text-xs text-gray-600 font-medium">{st.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString("ko-KR")}</td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => setDetailModal({ show: true, orderId: order.id })} className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="상세보기">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    {order.payment_status === "pending" && (
                                                        <button onClick={() => setConfirmModal({ show: true, title: "입금 확인", message: `주문번호: ${order.order_number}\n고객명: ${order.shipping_name}\n금액: ${order.final_amount.toLocaleString()}원\n\n입금을 확인하셨습니까?`, onConfirm: () => updatePaymentStatus(order.id, "paid") })}
                                                            className="px-2.5 py-1 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">입금확인</button>
                                                    )}
                                                    {order.payment_status === "paid" && (
                                                        <button onClick={() => setConfirmModal({ show: true, title: "상품 준비 시작", message: `주문번호: ${order.order_number}\n고객명: ${order.shipping_name}\n\n상품 준비를 시작하시겠습니까?`, onConfirm: () => updatePaymentStatus(order.id, "preparing") })}
                                                            className="px-2.5 py-1 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">상품준비</button>
                                                    )}
                                                    {order.payment_status === "preparing" && (<>
                                                        <button onClick={() => setEditModal({ show: true, orderId: order.id, orderNumber: order.order_number })}
                                                            className="px-2.5 py-1 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:border-gray-900 hover:text-gray-900 transition-colors">수정</button>
                                                        <button onClick={() => setTrackingModal({ show: true, orderId: order.id, orderNumber: order.order_number })}
                                                            className="px-2.5 py-1 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">송장입력</button>
                                                    </>)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filteredOrders.map((order) => {
                                const stMap: Record<string,{label:string;dot:string}> = {
                                    pending:   {label:"입금대기",   dot:"bg-gray-300"},
                                    paid:      {label:"입금완료",   dot:"bg-gray-900"},
                                    preparing: {label:"상품준비중", dot:"bg-gray-600"},
                                    shipped:   {label:"발송완료",   dot:"bg-gray-400"},
                                };
                                const st = stMap[order.payment_status] ?? {label:order.payment_status, dot:"bg-gray-200"};
                                return (
                                    <div key={order.id} className="p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} className="w-4 h-4 accent-gray-900 rounded" />
                                                <span className="font-bold text-gray-900">{order.shipping_name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                <span className="text-xs text-gray-500 font-medium">{st.label}</span>
                                            </div>
                                        </div>
                                        <div className="mb-3 space-y-1.5 pl-6 text-sm">
                                            <div className="flex justify-between"><span className="text-gray-400">주문번호</span><span className="font-mono text-xs text-gray-500">{order.order_number}</span></div>
                                            <div className="flex justify-between"><span className="text-gray-400">금액</span><span className="font-bold text-gray-900">{order.final_amount.toLocaleString()}원</span></div>
                                            <div className="flex justify-between"><span className="text-gray-400">주문일</span><span className="text-gray-500">{new Date(order.created_at).toLocaleDateString("ko-KR")}</span></div>
                                            {order.tracking_number && <div className="flex justify-between text-xs"><span className="text-gray-400">송장</span><span className="text-gray-500">{order.shipping_company} {order.tracking_number}</span></div>}
                                        </div>
                                        <div className="flex justify-end gap-2 pl-6">
                                            <button onClick={() => setDetailModal({ show: true, orderId: order.id })} className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:border-gray-400 transition-colors">상세보기</button>
                                            {order.payment_status === "pending" && <button onClick={() => setConfirmModal({ show: true, title: "입금 확인", message: `${order.order_number}\n${order.shipping_name}\n${order.final_amount.toLocaleString()}원\n\n입금을 확인하셨습니까?`, onConfirm: () => updatePaymentStatus(order.id, "paid") })} className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg">입금확인</button>}
                                            {order.payment_status === "paid" && <button onClick={() => setConfirmModal({ show: true, title: "상품 준비 시작", message: `${order.order_number}\n${order.shipping_name}\n\n상품 준비를 시작하시겠습니까?`, onConfirm: () => updatePaymentStatus(order.id, "preparing") })} className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg">상품준비</button>}
                                            {order.payment_status === "preparing" && (<>
                                                <button onClick={() => setEditModal({ show: true, orderId: order.id, orderNumber: order.order_number })} className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:border-gray-900">수정</button>
                                                <button onClick={() => setTrackingModal({ show: true, orderId: order.id, orderNumber: order.order_number })} className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg">송장입력</button>
                                            </>)}
                                        </div>
                                    </div>
                                );
                            })}
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

            <OrderEditModal
                isOpen={editModal.show}
                onClose={() => setEditModal({ show: false, orderId: "", orderNumber: "" })}
                orderId={editModal.orderId}
                orderNumber={editModal.orderNumber}
                onSuccess={fetchOrders}
            />
        </div>
    );
}
