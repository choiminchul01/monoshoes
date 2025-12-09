"use client";

import { useState, useEffect } from "react";
import { fetchInspectionsAction, createInspectionAction, deleteInspectionAction } from "./actions";
import { Trash2, Plus, X, Image as ImageIcon, RefreshCw, Upload, Calendar, User } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";

// 이름 마스킹 함수
function maskCustomerName(name: string): string {
    if (!name || name.length < 2) return name + "님";
    const first = name.charAt(0);
    const last = name.charAt(name.length - 1);
    const middleLength = name.length - 2;
    const middle = "*".repeat(Math.max(1, middleLength));
    return `${first}${middle}${last}님`;
}

type Inspection = {
    id: string;
    image_url: string;
    inspection_date: string;
    customer_name: string;
    created_at: string;
};

export default function AdminInspectionsPage() {
    const toast = useToast();
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [inspectionDate, setInspectionDate] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInspections();
    }, []);

    const fetchInspections = async () => {
        setLoading(true);
        const result = await fetchInspectionsAction();
        if (result.success) {
            setInspections(result.data);
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !inspectionDate || !customerName) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("inspectionDate", inspectionDate);
            formData.append("customerName", customerName);

            const result = await createInspectionAction(formData);
            if (result.success) {
                toast.success("출고검수가 등록되었습니다.");
                resetForm();
                fetchInspections();
            } else {
                toast.error(result.error || "등록에 실패했습니다.");
            }
        } catch (error) {
            toast.error("등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, imageUrl: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        const result = await deleteInspectionAction(id, imageUrl);
        if (result.success) {
            toast.success("삭제되었습니다.");
            fetchInspections();
        } else {
            toast.error("삭제에 실패했습니다.");
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setInspectionDate("");
        setCustomerName("");
        setIsCreateModalOpen(false);
    };

    return (
        <div>
            {/* Title Row */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">출고관리</h1>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 bg-gray-50 border-gray-200">
                        <span className="text-sm font-bold text-gray-500">
                            총 {inspections.length}건
                        </span>
                    </div>
                    <button
                        onClick={fetchInspections}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    검수 등록
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이미지</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">검수일</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명 (원본)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">표시명</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">로딩 중...</td></tr>
                        ) : inspections.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">
                                등록된 출고검수가 없습니다.
                            </td></tr>
                        ) : (
                            inspections.map((inspection) => (
                                <tr key={inspection.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                                            <Image
                                                src={inspection.image_url}
                                                alt="Inspection"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        {new Date(inspection.inspection_date).toLocaleDateString("ko-KR")}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {inspection.customer_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {maskCustomerName(inspection.customer_name)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(inspection.id, inspection.image_url)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">출고검수 등록</h2>
                            <button onClick={resetForm} className="text-gray-500 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <ImageIcon className="w-4 h-4 inline mr-1" />
                                    검수 이미지
                                </label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                    {previewUrl ? (
                                        <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                                            <Image
                                                src={previewUrl}
                                                alt="Preview"
                                                fill
                                                className="object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">클릭하여 업로드</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    검수 날짜
                                </label>
                                <input
                                    type="date"
                                    value={inspectionDate}
                                    onChange={(e) => setInspectionDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>

                            {/* Customer Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <User className="w-4 h-4 inline mr-1" />
                                    고객명
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="예: 홍길동"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                                {customerName && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        표시: <span className="font-medium text-gray-600">{maskCustomerName(customerName)}</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                                >
                                    {isSubmitting ? "등록 중..." : "검수 등록"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
