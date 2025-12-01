"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit2, Trash2, Megaphone, HelpCircle, X, Save, CheckSquare, Square, RefreshCw } from "lucide-react";
import { useToast } from "@/context/ToastContext";

type Notice = {
    id: string;
    title: string;
    content: string;
    is_important: boolean;
    created_at: string;
    view_count: number;
};

type FAQ = {
    id: string;
    category: string;
    question: string;
    answer: string;
    display_order: number;
};

export default function AdminBoardPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'notices' | 'faqs'>('notices');
    const [loading, setLoading] = useState(true);

    // Data States
    const [notices, setNotices] = useState<Notice[]>([]);
    const [faqs, setFaqs] = useState<FAQ[]>([]);

    // Modal States
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null); // Shared for edit mode

    // Form States
    const [noticeForm, setNoticeForm] = useState({ title: "", content: "", is_important: false });
    const [faqForm, setFaqForm] = useState({ category: "delivery", question: "", answer: "", display_order: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'notices') fetchNotices();
        else fetchFaqs();
    }, [activeTab]);

    const fetchNotices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("notices")
            .select("*")
            .order("is_important", { ascending: false }) // Important first
            .order("created_at", { ascending: false });

        if (error) toast.error("공지사항을 불러오는데 실패했습니다.");
        else setNotices(data || []);
        setLoading(false);
    };

    const fetchFaqs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("faqs")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) toast.error("FAQ를 불러오는데 실패했습니다.");
        else setFaqs(data || []);
        setLoading(false);
    };

    // --- Notice Handlers ---
    const handleSaveNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                const { error } = await supabase.from("notices").update(noticeForm).eq("id", editingItem.id);
                if (error) throw error;
                toast.success("공지사항이 수정되었습니다.");
            } else {
                const { error } = await supabase.from("notices").insert(noticeForm);
                if (error) throw error;
                toast.success("공지사항이 등록되었습니다.");
            }
            setIsNoticeModalOpen(false);
            setEditingItem(null);
            setNoticeForm({ title: "", content: "", is_important: false });
            fetchNotices();
        } catch (error) {
            console.error(error);
            toast.error("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteNotice = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        const { error } = await supabase.from("notices").delete().eq("id", id);
        if (error) toast.error("삭제 실패");
        else {
            toast.success("삭제되었습니다.");
            fetchNotices();
        }
    };

    // --- FAQ Handlers ---
    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                const { error } = await supabase.from("faqs").update(faqForm).eq("id", editingItem.id);
                if (error) throw error;
                toast.success("FAQ가 수정되었습니다.");
            } else {
                const { error } = await supabase.from("faqs").insert(faqForm);
                if (error) throw error;
                toast.success("FAQ가 등록되었습니다.");
            }
            setIsFaqModalOpen(false);
            setEditingItem(null);
            setFaqForm({ category: "delivery", question: "", answer: "", display_order: 0 });
            fetchFaqs();
        } catch (error) {
            console.error(error);
            toast.error("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFaq = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        const { error } = await supabase.from("faqs").delete().eq("id", id);
        if (error) toast.error("삭제 실패");
        else {
            toast.success("삭제되었습니다.");
            fetchFaqs();
        }
    };

    const openNoticeModal = (notice?: Notice) => {
        if (notice) {
            setEditingItem(notice);
            setNoticeForm({ title: notice.title, content: notice.content, is_important: notice.is_important });
        } else {
            setEditingItem(null);
            setNoticeForm({ title: "", content: "", is_important: false });
        }
        setIsNoticeModalOpen(true);
    };

    const openFaqModal = (faq?: FAQ) => {
        if (faq) {
            setEditingItem(faq);
            setFaqForm({ category: faq.category, question: faq.question, answer: faq.answer, display_order: faq.display_order });
        } else {
            setEditingItem(null);
            setFaqForm({ category: "delivery", question: "", answer: "", display_order: faqs.length + 1 });
        }
        setIsFaqModalOpen(true);
    };

    // Search State
    const [searchTerm, setSearchTerm] = useState("");

    // Calculate new content count (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newNoticesCount = notices.filter(notice =>
        new Date(notice.created_at) > sevenDaysAgo
    ).length;
    const newFaqsCount = faqs.filter(faq =>
        faq.display_order > (faqs.length - 7) // Assume recent FAQs have higher order
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

    const getFilteredFaqs = () => {
        if (!searchTerm) return faqs;
        const lower = searchTerm.toLowerCase();
        return faqs.filter(f =>
            f.question.toLowerCase().includes(lower) ||
            f.answer.toLowerCase().includes(lower)
        );
    };

    const filteredNotices = getFilteredNotices();
    const filteredFaqs = getFilteredFaqs();

    return (
        <div>
            {/* Title Row */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">게시판 관리</h1>
            </div>

            {/* Tab Selection */}
            <div className="mb-6">
                <div className="flex bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setActiveTab('notices')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'notices' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        공지사항
                    </button>
                    <button
                        onClick={() => setActiveTab('faqs')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'faqs' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        자주 묻는 질문 (FAQ)
                    </button>
                </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${(activeTab === 'notices' ? newNoticesCount : newFaqsCount) > 0
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        <span className={`text-sm font-bold ${(activeTab === 'notices' ? newNoticesCount : newFaqsCount) > 0
                            ? 'text-purple-700'
                            : 'text-gray-500'
                            }`}>
                            새 {activeTab === 'notices' ? '공지' : 'FAQ'} {activeTab === 'notices' ? newNoticesCount : newFaqsCount}건
                        </span>
                    </div>
                    <button
                        onClick={() => activeTab === 'notices' ? fetchNotices() : fetchFaqs()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        새로고침
                    </button>
                </div>
                <button
                    onClick={() => activeTab === 'notices' ? openNoticeModal() : openFaqModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {activeTab === 'notices' ? '공지사항 등록' : 'FAQ 등록'}
                </button>
            </div>

            {/* Search Row */}
            <div className="mb-8 mt-4">
                <input
                    type="text"
                    placeholder={`${activeTab === 'notices' ? '제목, 내용' : '질문, 답변'} 검색...`}
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
                    ) : activeTab === 'notices' ? (
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
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(notice.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button onClick={() => openNoticeModal(notice)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteNotice(notice.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        // FAQ List
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">순서</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">카테고리</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">질문</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredFaqs.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">
                                        {searchTerm ? '검색 결과가 없습니다.' : '등록된 FAQ가 없습니다.'}
                                    </td></tr>
                                ) : (
                                    filteredFaqs.map(faq => (
                                        <tr key={faq.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-gray-500">{faq.display_order}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                                    {faq.category === 'delivery' ? '배송' :
                                                        faq.category === 'order' ? '주문/결제' :
                                                            faq.category === 'product' ? '상품' :
                                                                faq.category === 'return' ? '반품/교환' : '기타'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{faq.question}</td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button onClick={() => openFaqModal(faq)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteFaq(faq.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{editingItem ? '공지사항 수정' : '공지사항 등록'}</h2>
                                <button onClick={() => setIsNoticeModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleSaveNotice} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={noticeForm.title}
                                        onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
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
                                    <label className="block text-sm font-medium mb-1">내용</label>
                                    <textarea
                                        value={noticeForm.content}
                                        onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-40 resize-none"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button type="button" onClick={() => setIsNoticeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800">저장</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* FAQ Modal */}
            {
                isFaqModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">{editingItem ? 'FAQ 수정' : 'FAQ 등록'}</h2>
                                <button onClick={() => setIsFaqModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleSaveFaq} className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-1">카테고리</label>
                                        <select
                                            value={faqForm.category}
                                            onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        >
                                            <option value="delivery">배송</option>
                                            <option value="order">주문/결제</option>
                                            <option value="product">상품</option>
                                            <option value="return">반품/교환</option>
                                            <option value="other">기타</option>
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-sm font-medium mb-1">순서</label>
                                        <input
                                            type="number"
                                            value={faqForm.display_order}
                                            onChange={(e) => setFaqForm({ ...faqForm, display_order: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">질문</label>
                                    <input
                                        type="text"
                                        value={faqForm.question}
                                        onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">답변</label>
                                    <textarea
                                        value={faqForm.answer}
                                        onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg h-40 resize-none"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button type="button" onClick={() => setIsFaqModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800">저장</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
