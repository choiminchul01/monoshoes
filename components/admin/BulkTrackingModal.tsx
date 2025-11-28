"use client";

import { useState } from "react";
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabase";

type BulkTrackingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

type PreviewItem = {
    orderNumber: string;
    shippingCompany: string;
    trackingNumber: string;
    status: "ready" | "error";
    message?: string;
};

export default function BulkTrackingModal({
    isOpen,
    onClose,
    onSuccess,
}: BulkTrackingModalProps) {
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
    const [file, setFile] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleDownloadTemplate = async () => {
        try {
            // Fetch only 'paid' orders that need shipping
            const { data: orders, error } = await supabase
                .from("orders")
                .select("*")
                .eq("payment_status", "paid")
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!orders || orders.length === 0) {
                alert("배송 준비 중인(입금완료) 주문이 없습니다.");
                return;
            }

            // Prepare data for Excel
            const templateData = orders.map(order => ({
                "주문번호 (수정불가)": order.order_number,
                "고객명": order.shipping_name,
                "연락처": order.shipping_phone,
                "주소": `${order.shipping_address} ${order.shipping_address_detail}`,
                "상품명": "상품 정보 확인 필요", // In a real app, we'd join order_items names
                "배송메시지": order.shipping_memo || "",
                "택배사 (입력)": "",
                "송장번호 (입력)": ""
            }));

            const ws = XLSX.utils.json_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "배송요망목록");

            // Adjust column widths
            ws["!cols"] = [
                { wch: 20 }, // Order Number
                { wch: 10 }, // Name
                { wch: 15 }, // Phone
                { wch: 40 }, // Address
                { wch: 20 }, // Product
                { wch: 20 }, // Memo
                { wch: 15 }, // Company
                { wch: 20 }, // Tracking Number
            ];

            const fileName = `배송요망목록_${new Date().toISOString().split("T")[0]}.xlsx`;
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, fileName);
        } catch (error) {
            console.error("템플릿 다운로드 실패:", error);
            alert("목록 다운로드 중 오류가 발생했습니다.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

                const parsed: PreviewItem[] = jsonData.map((row: any) => {
                    // Map columns based on the template headers
                    const orderNumber = row["주문번호 (수정불가)"] || row["주문번호"] || "";
                    const shippingCompany = row["택배사 (입력)"] || row["택배사"] || "";
                    const trackingNumber = row["송장번호 (입력)"] || row["송장번호"] || "";

                    let status: "ready" | "error" = "ready";
                    let message = "";

                    if (!orderNumber) {
                        status = "error";
                        message = "주문번호 누락";
                    } else if (!trackingNumber) {
                        status = "error";
                        message = "송장번호 누락";
                    }

                    return {
                        orderNumber: String(orderNumber).trim(),
                        shippingCompany: String(shippingCompany).trim() || "CJ대한통운", // Default to CJ if empty but tracking exists
                        trackingNumber: String(trackingNumber).trim(),
                        status,
                        message
                    };
                }).filter(item => item.orderNumber); // Filter out completely empty rows

                setPreviewData(parsed);
            } catch (error) {
                console.error("엑셀 파싱 실패:", error);
                alert("파일을 읽는 중 오류가 발생했습니다.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleUpload = async () => {
        const validItems = previewData.filter(item => item.status === "ready");
        if (validItems.length === 0) {
            alert("업로드할 유효한 데이터가 없습니다.");
            return;
        }

        if (!confirm(`${validItems.length}건의 송장 정보를 업데이트하시겠습니까?`)) return;

        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (const item of validItems) {
            try {
                // Find order ID by order number first (since we only have order_number in excel)
                const { data: orderData, error: findError } = await supabase
                    .from("orders")
                    .select("id")
                    .eq("order_number", item.orderNumber)
                    .single();

                if (findError || !orderData) {
                    throw new Error("주문을 찾을 수 없음");
                }

                const { error: updateError } = await supabase
                    .from("orders")
                    .update({
                        tracking_number: item.trackingNumber,
                        shipping_company: item.shippingCompany,
                        payment_status: "shipped"
                    })
                    .eq("id", orderData.id);

                if (updateError) throw updateError;
                successCount++;
            } catch (error) {
                console.error(`주문번호 ${item.orderNumber} 업데이트 실패:`, error);
                failCount++;
            }
        }

        setUploading(false);
        alert(`완료: 성공 ${successCount}건, 실패 ${failCount}건`);
        onSuccess();
        onClose();
        setFile(null);
        setPreviewData([]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">운송장 일괄 업로드</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Step 1: Download Template */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                            배송요망 리스트 다운로드
                        </h4>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800 mb-3">
                                현재 <strong>입금완료(배송준비)</strong> 상태인 주문 목록을 엑셀로 다운로드합니다.<br />
                                다운로드된 파일의 <strong>택배사</strong>와 <strong>송장번호</strong> 열을 채워주세요.
                            </p>
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                배송요망 목록 다운로드 (Excel)
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Upload File */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">2</span>
                            파일 업로드
                        </h4>

                        {!file ? (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="text-sm text-gray-500">
                                        <span className="font-semibold">클릭하여 엑셀 파일 업로드</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">.xlsx, .xls 파일만 가능</p>
                                </div>
                                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                            </label>
                        ) : (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                    </div>
                                    <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-xs text-red-500 hover:text-red-700">
                                        삭제
                                    </button>
                                </div>

                                <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2">상태</th>
                                                <th className="px-4 py-2">주문번호</th>
                                                <th className="px-4 py-2">송장번호</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((item, idx) => (
                                                <tr key={idx} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-2">
                                                        {item.status === "ready" ? (
                                                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                                <CheckCircle className="w-3 h-3" /> 준비
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                                                                <AlertCircle className="w-3 h-3" /> {item.message}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-xs">{item.orderNumber}</td>
                                                    <td className="px-4 py-2 font-mono text-xs">{item.trackingNumber || "-"}</td>
                                                </tr>
                                            ))}
                                            {previewData.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                                        데이터를 읽어오는 중이거나 데이터가 없습니다.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                                    <span>총 {previewData.length}건</span>
                                    <span>
                                        성공 예상: <span className="text-green-600 font-bold">{previewData.filter(i => i.status === "ready").length}</span> /
                                        오류: <span className="text-red-600 font-bold">{previewData.filter(i => i.status === "error").length}</span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        disabled={uploading}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading || previewData.filter(i => i.status === "ready").length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? "업로드 중..." : "일괄 업데이트 시작"}
                    </button>
                </div>
            </div>
        </div>
    );
}
