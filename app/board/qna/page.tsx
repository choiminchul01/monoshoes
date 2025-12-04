"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MessageCircle, Lock, ChevronDown, ChevronUp, X, Search, PenSquare, CheckCircle } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

type GeneralQnA = {
    id: string;
    title: string;
    content: string;
    answer: string | null;
    is_private: boolean;
    is_answered: boolean;
    author_name: string | null;
    user_id: string | null;
    created_at: string;
    answered_at: string | null;
};

export default function GeneralQnAPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [qnas, setQnas] = useState<GeneralQnA[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    // Write Modal
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [form, setForm] = useState({
        title: '',
        content: '',
        is_private: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQnAs();
    }, [currentPage]);

    const fetchQnAs = async () => {
        setLoading(true);
        try {
            // Get total count
            const { count } = await supabase
                .from('general_qna')
                .select('*', { count: 'exact', head: true });

            setTotalCount(count || 0);

            // Get data
            const { data, error } = await supabase
                .from('general_qna')
                .select('*')
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;

            if (data) {
                // Filter private posts logic
                // Note: RLS handles security, but we can also visually indicate or filter if needed
                // Here we trust RLS to return only what user is allowed to see (public + own + admin)
                // But for "list" view, we might want to show "Secret Post" placeholder for others?
                // Actually, standard practice is to show title but hide content if private & not owner.
                // However, our RLS policy currently hides the ROW entirely if private & not owner.
                // So the list will only contain visible items.
                setQnas(data);
            }
        } catch (error) {
            console.error("Error fetching Q&As:", error);
            toast.error("게시글을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        if (!form.title.trim() || !form.content.trim()) {
            toast.error('제목과 내용을 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('general_qna').insert({
                user_id: user.id,
                author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '익명',
                title: form.title.trim(),
                content: form.content.trim(),
                is_private: form.is_private
            });

            if (error) throw error;

            toast.success('문의가 등록되었습니다.');
            setForm({ title: '', content: '', is_private: false });
            setIsWriteModalOpen(false);
            setCurrentPage(1); // Go to first page
            fetchQnAs();
        } catch (error: any) {
            toast.error(error.message || '문의 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleExpand = (qna: GeneralQnA) => {
        if (expandedId === qna.id) {
            setExpandedId(null);
        } else {
            setExpandedId(qna.id);
        }
    };

    return (
        <div className="container mx-auto px-4 py-20 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-16">
                <h1 className="text-3xl font-bold tracking-widest mb-4">Q&A BOARD</h1>
                <p className="text-gray-500">궁금한 점을 자유롭게 문의해주세요.</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => user ? setIsWriteModalOpen(true) : toast.error('로그인이 필요합니다.')}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                    <PenSquare className="w-4 h-4" />
                    문의하기
                </button>
            </div>

            {/* List */}
            <div className="bg-white border-t border-gray-200">
                {loading ? (
                    <div className="py-20 text-center text-gray-400">Loading...</div>
                ) : qnas.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 rounded-lg my-4">
                        <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">등록된 문의가 없습니다.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {qnas.map((qna) => (
                            <div key={qna.id} className="group">
                                <button
                                    onClick={() => toggleExpand(qna)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            {qna.is_private && <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                                            <h3 className="font-medium text-gray-900 truncate pr-4">
                                                {qna.title}
                                            </h3>
                                            {qna.is_answered ? (
                                                <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                    답변완료
                                                </span>
                                            ) : (
                                                <span className="flex-shrink-0 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-bold rounded">
                                                    대기중
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            <span>{qna.author_name || '익명'}</span>
                                            <span>•</span>
                                            <span>{new Date(qna.created_at).toLocaleDateString('ko-KR')}</span>
                                        </div>
                                    </div>
                                    {expandedId === qna.id ? (
                                        <ChevronUp className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                                    )}
                                </button>

                                {/* Expanded Content */}
                                {expandedId === qna.id && (
                                    <div className="bg-gray-50 px-6 py-6 border-t border-gray-100">
                                        {/* Question */}
                                        <div className="mb-8">
                                            <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded mb-2">Q</span>
                                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                {qna.content}
                                            </p>
                                        </div>

                                        {/* Answer */}
                                        {qna.answer ? (
                                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="inline-block px-2 py-1 bg-black text-white text-xs font-bold rounded">A</span>
                                                    <span className="text-sm font-bold text-gray-900">관리자 답변</span>
                                                    <span className="text-xs text-gray-400">
                                                        {qna.answered_at && new Date(qna.answered_at).toLocaleDateString('ko-KR')}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {qna.answer}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 italic">
                                                아직 답변이 등록되지 않았습니다.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8">
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalCount / itemsPerPage)}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Write Modal */}
            {isWriteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">문의 작성</h2>
                            <button
                                onClick={() => setIsWriteModalOpen(false)}
                                className="text-gray-400 hover:text-black transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">제목</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="제목을 입력해주세요"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">내용</label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent h-40 resize-none"
                                    placeholder="문의하실 내용을 자세히 적어주세요."
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={form.is_private}
                                            onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-black checked:bg-black hover:border-black transition-all"
                                        />
                                        <CheckCircle className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">비공개 글로 작성</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsWriteModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '등록 중...' : '등록하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
