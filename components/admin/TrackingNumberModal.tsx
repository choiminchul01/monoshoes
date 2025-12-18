"use client";

import { useState } from "react";
import { X } from "lucide-react";

type TrackingNumberModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (trackingNumber: string, shippingCompany: string) => void;
    orderNumber: string;
};

const SHIPPING_COMPANIES = [
    { value: "CJ대한통운", label: "CJ대한통운", trackingUrl: "https://trace.cjlogistics.com/web/detail.jsp?slipno=" },
    { value: "우체국택배", label: "우체국택배", trackingUrl: "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=" },
    { value: "한진택배", label: "한진택배", trackingUrl: "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=" },
    { value: "롯데택배", label: "롯데택배", trackingUrl: "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=" },
    { value: "로젠택배", label: "로젠택배", trackingUrl: "https://www.ilogen.com/web/personal/trace/" },
    { value: "GSMNtoN", label: "GSMNtoN", trackingUrl: "https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=" },
    { value: "기타", label: "기타", trackingUrl: "" },
];

export default function TrackingNumberModal({
    isOpen,
    onClose,
    onConfirm,
    orderNumber,
}: TrackingNumberModalProps) {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shippingCompany, setShippingCompany] = useState("CJ대한통운");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!trackingNumber.trim()) {
            alert("송장번호를 입력해주세요");
            return;
        }

        onConfirm(trackingNumber, shippingCompany);
        setTrackingNumber("");
        setShippingCompany("CJ대한통운");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#001E10] to-[#000000] opacity-95" />

            {/* Brand Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <h1
                    className="text-[15vw] font-bold text-[#D4AF37] opacity-10 select-none whitespace-nowrap tracking-widest"
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                    ESSENTIA
                </h1>
            </div>

            <div className="relative z-10 bg-[#FDFCF5] rounded-lg p-6 max-w-md w-full mx-4 border border-[#D4AF37]/30 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">송장 입력</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-4 p-3 bg-[#00704A]/10 border border-[#00704A]/20 rounded-lg">
                    <p className="text-sm text-gray-800">
                        <strong>주문번호:</strong> {orderNumber}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        송장번호를 입력하면 자동으로 <strong className="text-[#00704A]">발송완료</strong> 상태로 변경됩니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">택배사</label>
                        <select
                            value={shippingCompany}
                            onChange={(e) => setShippingCompany(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                        >
                            {SHIPPING_COMPANIES.map((company) => (
                                <option key={company.value} value={company.value}>
                                    {company.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">송장번호</label>
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="송장번호를 입력하세요"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#00704A] text-white rounded-lg hover:bg-[#005A3C] transition-colors"
                        >
                            입력 완료
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
