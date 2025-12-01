"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MessageCircle, Lock, ChevronDown, ChevronUp, X } from 'lucide-react';

type QnA = {
    id: string;
    question: string;
    answer: string | null;
    is_private: boolean;
    is_answered: boolean;
    author_name: string | null;
    user_id: string | null;
    created_at: string;
    answered_at: string | null;
};

type ProductQnAProps = {
    productId: string;
};

export default function ProductQnA({ productId }: ProductQnAProps) {
    const { user } = useAuth();
    const toast = useToast();
    const [qnas, setQnas] = useState<QnA[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [form, setForm] = useState({
        question: '',
        is_private: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQnA();
    }, [productId]);

    const fetchQnA = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('product_qna')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (data) {
            // 로그인하지 않은 경우 비공개 문의는 제외
            const filteredData = data.filter((qna: QnA) => {
                if (!qna.is_private) return true;
                if (user && qna.user_id === user.id) return true;
                return false;
            });
            setQnas(filteredData);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        if (!form.question.trim()) {
            toast.error('문의 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('product_qna').insert({
                product_id: productId,
                user_id: user.id,
                author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '익명',
                question: form.question.trim(),
                is_private: form.is_private
            });

            if (error) throw error;

            toast.success('문의가 등록되었습니다.');
            setForm({ question: '', is_private: false });
            setIsWriteModalOpen(false);
            fetchQnA();
        } catch (error: any) {
            toast.error(error.message || '문의 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-24 border-t border-gray-200 pt-16 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold tracking-widest">PRODUCT Q&A</h3>
                <button
                    onClick={() => user ? setIsWriteModalOpen(true) : toast.error('로그인이 필요합니다.')}
                    className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                    문의하기
                </button>
            </div>

            {/* Q&A List */}
            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : qnas.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-20 text-center border border-gray-200">
                    <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">아직 등록된 문의가 없습니다.</p>
                    <p className="text-sm text-gray-400 mt-2">제품에 대해 궁금한 점을 물어보세요.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {qnas.map((qna) => (
                        <div key={qna.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setExpandedId(expandedId === qna.id ? null : qna.id)}
                                className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {qna.is_private && <Lock className="w-4 h-4 text-gray-400" />}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">Q.</span>
                                            <span className="font-medium">{qna.question}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span>{qna.author_name || '익명'}</span>
                                            <span>•</span>
                                            <span>{new Date(qna.created_at).toLocaleDateString('ko-KR')}</span>
                                            {qna.is_answered && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-green-600 font-medium">답변완료</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {expandedId === qna.id ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {expandedId === qna.id && qna.answer && (
                                <div className="p-5 bg-blue-50 border-t border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <span className="font-semibold text-blue-900">A.</span>
                                        <div className="flex-1">
                                            <p className="text-gray-800 whitespace-pre-wrap">{qna.answer}</p>
                                            {qna.answered_at && (
                                                <p className="text-sm text-gray-500 mt-2">
                                                    {new Date(qna.answered_at).toLocaleDateString('ko-KR')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {expandedId === qna.id && !qna.answer && (
                                <div className="p-5 bg-gray-50 border-t border-gray-200 text-center text-gray-500 text-sm">
                                    답변 대기 중입니다.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Write Modal */}
            {isWriteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">제품 문의</h2>
                            <button
                                onClick={() => setIsWriteModalOpen(false)}
                                className="text-gray-500 hover:text-black"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">문의 내용</label>
                                <textarea
                                    value={form.question}
                                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black h-32 resize-none"
                                    placeholder="제품에 대해 궁금한 점을 작성해주세요."
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_private}
                                        onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700">비공개 문의</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                    비공개 문의는 본인과 관리자만 확인할 수 있습니다.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsWriteModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '등록 중...' : '문의 등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
