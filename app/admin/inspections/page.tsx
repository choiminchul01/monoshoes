"use client";

import { useState, useEffect } from "react";
import { fetchInspectionsAction, createInspectionAction, updateInspectionAction, deleteInspectionAction } from "./actions";
import { Trash2, Plus, X, Image as ImageIcon, RefreshCw, Upload, Calendar, User, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
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
    image_urls: string[];
    inspection_date: string;
    customer_name: string;
    created_at: string;
};

export default function AdminInspectionsPage() {
    const toast = useToast();
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State (통합: 등록/수정/조회)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null); // null = 신규등록
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingUrls, setExistingUrls] = useState<string[]>([]);
    const [inspectionDate, setInspectionDate] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image Gallery Modal
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);

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
        const files = Array.from(e.target.files || []);
        if (files.length) {
            setSelectedFiles(prev => [...prev, ...files]);
            setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        }
    };

    const removePreviewImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index: number) => {
        setExistingUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const allImages = existingUrls.length + selectedFiles.length;
        if (allImages === 0 || !inspectionDate || !customerName) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            selectedFiles.forEach(file => formData.append("files", file));
            formData.append("inspectionDate", inspectionDate);
            formData.append("customerName", customerName);

            let result;
            if (editingId) {
                formData.append("id", editingId);
                formData.append("existingUrls", JSON.stringify(existingUrls));
                result = await updateInspectionAction(formData);
            } else {
                result = await createInspectionAction(formData);
            }

            if (result.success) {
                toast.success(editingId ? "수정되었습니다." : "등록되었습니다.");
                resetForm();
                fetchInspections();
            } else {
                toast.error(result.error || "처리에 실패했습니다.");
            }
        } catch (error) {
            toast.error("처리 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, imageUrls: string[]) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        const result = await deleteInspectionAction(id, imageUrls || []);
        if (result.success) {
            toast.success("삭제되었습니다.");
            fetchInspections();
        } else {
            toast.error("삭제에 실패했습니다.");
        }
    };

    const openEditModal = (inspection: Inspection) => {
        setEditingId(inspection.id);
        setExistingUrls(inspection.image_urls || (inspection.image_url ? [inspection.image_url] : []));
        setPreviewUrls([]);
        setSelectedFiles([]);
        setInspectionDate(inspection.inspection_date);
        setCustomerName(inspection.customer_name);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setSelectedFiles([]);
        setPreviewUrls([]);
        setExistingUrls([]);
        setInspectionDate("");
        setCustomerName("");
        setEditingId(null);
        setIsModalOpen(false);
    };

    const openGallery = (images: string[], startIndex: number = 0) => {
        setGalleryImages(images);
        setGalleryIndex(startIndex);
        setGalleryOpen(true);
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
                    onClick={openCreateModal}
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
                                <tr
                                    key={inspection.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => openEditModal(inspection)}
                                >
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <div
                                            className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80"
                                            onClick={() => openGallery(inspection.image_urls || [inspection.image_url])}
                                        >
                                            <Image
                                                src={inspection.image_url}
                                                alt="Inspection"
                                                fill
                                                className="object-cover"
                                            />
                                            {(inspection.image_urls?.length || 0) > 1 && (
                                                <span className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-[10px] px-1">
                                                    +{inspection.image_urls.length - 1}
                                                </span>
                                            )}
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
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => openEditModal(inspection)}
                                            className="text-[#00704A] hover:text-[#005A3C] p-2 mr-1"
                                            title="수정"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(inspection.id, inspection.image_urls || [inspection.image_url])}
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
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

                    {/* Modal Content */}
                    <div className="relative z-10 bg-[#FDFCF5] rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-[#D4AF37]/30 shadow-xl">
                        <div className="sticky top-0 bg-[#FDFCF5] border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingId ? "출고검수 수정" : "출고검수 등록"}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Multi-Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <ImageIcon className="w-4 h-4 inline mr-1" />
                                    검수 이미지 (여러 장 가능, 첫 번째 = 대표)
                                </label>

                                {/* Existing Images */}
                                {existingUrls.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {existingUrls.map((url, index) => (
                                            <div key={index} className="relative w-20 h-20">
                                                <Image
                                                    src={url}
                                                    alt={`Image ${index + 1}`}
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                                {index === 0 && (
                                                    <span className="absolute top-0 left-0 bg-[#00704A] text-white text-[10px] px-1 rounded-br">
                                                        대표
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* New Preview Images */}
                                {previewUrls.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {previewUrls.map((url, index) => (
                                            <div key={index} className="relative w-20 h-20">
                                                <Image
                                                    src={url}
                                                    alt={`Preview ${index + 1}`}
                                                    fill
                                                    className="object-cover rounded-lg border-2 border-[#00704A]"
                                                />
                                                {existingUrls.length === 0 && index === 0 && (
                                                    <span className="absolute top-0 left-0 bg-[#00704A] text-white text-[10px] px-1 rounded-br">
                                                        대표
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removePreviewImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload Button */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#00704A] transition-colors">
                                    <label className="cursor-pointer block">
                                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">클릭하여 이미지 추가</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Date Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    검수 날짜
                                </label>
                                <input
                                    type="date"
                                    value={inspectionDate}
                                    onChange={(e) => setInspectionDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    직접 입력: YYYY-MM-DD (예: 2025-12-18)
                                </p>
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
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
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-[#00704A] text-white rounded-lg hover:bg-[#005A3C] disabled:bg-gray-400 transition-colors"
                                >
                                    {isSubmitting ? "처리 중..." : (editingId ? "수정" : "등록")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Image Gallery Modal */}
            {galleryOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
                    onClick={() => setGalleryOpen(false)}
                >
                    <button
                        onClick={() => setGalleryOpen(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {galleryImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setGalleryIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
                                }}
                                className="absolute left-4 text-white hover:text-gray-300 p-2"
                            >
                                <ChevronLeft className="w-10 h-10" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setGalleryIndex(prev => (prev + 1) % galleryImages.length);
                                }}
                                className="absolute right-4 text-white hover:text-gray-300 p-2"
                            >
                                <ChevronRight className="w-10 h-10" />
                            </button>
                        </>
                    )}

                    <div className="relative w-full max-w-3xl aspect-square mx-4" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={galleryImages[galleryIndex]}
                            alt="Gallery Image"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <div className="absolute bottom-4 text-white text-sm">
                        {galleryIndex + 1} / {galleryImages.length}
                    </div>
                </div>
            )}
        </div>
    );
}
