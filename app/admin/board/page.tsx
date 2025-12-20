"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit2, Trash2, X, RefreshCw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { saveNoticeAction, deleteNoticeAction } from "./actions";

type Notice = {
    id: string;
    title: string;
    content: string;
    is_important: boolean;
    notice_date: string;
    created_at: string;
    view_count: number;
    image_url?: string | null;
};

export default function AdminBoardPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);

    // Data States
    const [notices, setNotices] = useState<Notice[]>([]);

    // Modal States
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form States
    const [noticeForm, setNoticeForm] = useState<{ title: string; content: string; is_important: boolean; notice_date: string; file: File | null }>({
        title: "",
        content: "",
        is_important: false,
        notice_date: new Date().toISOString().split('T')[0],
        file: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("notices")
            .select("*")
            .order("is_important", { ascending: false }) // Important first
            .order("notice_date", { ascending: false }); // Then by notice_date

        if (error) toast.error("공지사항을 불러오는데 실패했습니다.");
        else setNotices(data || []);
        setLoading(false);
    };

    // --- Notice Handlers ---
    const handleSaveNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            if (editingItem?.id) formData.append("id", editingItem.id);
            formData.append("title", noticeForm.title);
            formData.append("content", noticeForm.content);
            formData.append("is_important", String(noticeForm.is_important));
            formData.append("notice_date", noticeForm.notice_date);
            if (noticeForm.file) formData.append("file", noticeForm.file);

            const result = await saveNoticeAction(formData);

            if (!result.success) throw new Error(result.error);

            toast.success(editingItem ? "공지사항이 수정되었습니다." : "공지사항이 등록되었습니다.");

            setIsNoticeModalOpen(false);
            setEditingItem(null);
            setNoticeForm({ title: "", content: "", is_important: false, notice_date: new Date().toISOString().split('T')[0], file: null });
            fetchNotices(); // Refresh client list
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "저장 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteNotice = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        try {
            const result = await deleteNoticeAction(id);
            if (!result.success) throw new Error(result.error);

            toast.success("삭제되었습니다.");
            fetchNotices();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "삭제 실패");
        }
    };

    const openNoticeModal = (notice?: Notice) => {
        if (notice) {
            setEditingItem(notice);
            setNoticeForm({
                title: notice.title,
                content: notice.content,
                is_important: notice.is_important,
                notice_date: notice.notice_date || new Date().toISOString().split('T')[0],
                file: null
            });
        } else {
            setEditingItem(null);
            setNoticeForm({ title: "", content: "", is_important: false, notice_date: new Date().toISOString().split('T')[0], file: null });
        }
        setIsNoticeModalOpen(true);
    };

    // Search State
    const [searchTerm, setSearchTerm] = useState("");

    // Calculate new content count (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newNoticesCount = notices.filter(notice =>
        new Date(notice.created_at) > sevenDaysAgo
    ).length;

    // Filter data based on search
    const getFilteredNotices = () => {
        if (!searchTerm) return notices;
        const lower = searchTerm.toLowerCase();
        return notices.filter(n =>
            n.title.toLowerCase().includes(lower) ||
            n.content.toLowerCase().includes(lower)
        );
    };

    const filteredNotices = getFilteredNotices();

    return (
        <div>
            {/* Title Row */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">공지사항 관리</h1>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${newNoticesCount > 0
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        <span className={`text-sm font-bold ${newNoticesCount > 0
                            ? 'text-purple-700'
                            : 'text-gray-500'
                            }`}>
                            새 공지 {newNoticesCount}건
                        </span>
                    </div>
                    <button
                        onClick={() => fetchNotices()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                </div>
                <button
                    onClick={() => openNoticeModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    공지사항 등록
                </button>
            </div>

            {/* Search Row */}
            <div className="mb-8 mt-4">
                <input
                    type="text"
                    placeholder="제목, 내용 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">로딩 중...</div>
                    ) : (
                        // Notices List
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">중요</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">작성일</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredNotices.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">
                                        {searchTerm ? '검색 결과가 없습니다.' : '등록된 공지사항이 없습니다.'}
                                    </td></tr>
                                ) : (
                                    filteredNotices.map(notice => (
                                        <tr key={notice.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                {notice.is_important && <span className="text-red-500 font-bold text-xs border border-red-200 bg-red-50 px-2 py-1 rounded">필독</span>}
                                            </td>
                                            <td className="px-6 py-4 font-medium">{notice.title}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{notice.notice_date || new Date(notice.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button onClick={() => openNoticeModal(notice)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteNotice(notice.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Notice Modal */}
            {
                isNoticeModalOpen && (
                    <div className="admin-modal-overlay">
                        <div className="admin-modal-card w-full max-w-lg">
                            <div className="admin-modal-header">
                                <h2>{editingItem ? '공지사항 수정' : '공지사항 등록'}</h2>
                                <button onClick={() => setIsNoticeModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSaveNotice} className="admin-modal-body space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={noticeForm.title}
                                        onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={noticeForm.is_important}
                                            onChange={(e) => setNoticeForm({ ...noticeForm, is_important: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-red-600">중요 공지 (상단 고정)</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">공지 날짜</label>
                                    <input
                                        type="date"
                                        value={noticeForm.notice_date}
                                        onChange={(e) => setNoticeForm({ ...noticeForm, notice_date: e.target.value })}
                                        max="9999-12-31"
                                        min="2000-01-01"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">선택한 날짜 기준으로 정렬됩니다</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">이미지 첨부</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setNoticeForm({ ...noticeForm, file: e.target.files?.[0] || null })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                    {editingItem?.image_url && !noticeForm.file && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-1">현재 이미지:</p>
                                            <img src={editingItem.image_url} alt="Current" className="h-20 object-cover rounded border" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">내용</label>
                                    <textarea
                                        value={noticeForm.content}
                                        onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-40 resize-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button type="button" onClick={() => setIsNoticeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                                    <button type="submit" disabled={isSubmitting} className="admin-btn-primary px-6 py-2">저장</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
