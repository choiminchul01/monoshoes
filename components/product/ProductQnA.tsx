"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MessageCircle, Lock, ChevronDown, ChevronUp, X, Check } from 'lucide-react';

// 문의 카테고리 정의
const INQUIRY_CATEGORIES = [
    { id: 'color', label: '색상 문의' },
    { id: 'size', label: '사이즈 문의' },
    { id: 'delivery', label: '배송 문의' },
    { id: 'payment', label: '결제 문의' },
    { id: 'other', label: '기타 문의' },
] as const;

type InquiryCategoryId = typeof INQUIRY_CATEGORIES[number]['id'];

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
    category?: string;
};

type ProductQnAProps = {
    productId: string;
};

// 이름 마스킹 함수: 홍길동 → 홍*동, 성춘향 → 성*향
const maskName = (name: string | null): string => {
    if (!name) return '익명';

    const trimmed = name.trim();
    if (trimmed.length === 0) return '익명';
    if (trimmed.length === 1) return trimmed;
    if (trimmed.length === 2) return trimmed[0] + '*';

    // 3글자 이상: 첫 글자 + * + 마지막 글자
    // 예: 홍길동 → 홍*동, 김철수 → 김*수
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    const middleStars = '*'.repeat(trimmed.length - 2);
    return first + middleStars + last;
};

// 카테고리 ID로 라벨 가져오기
const getCategoryLabel = (categoryId: string | undefined): string => {
    const category = INQUIRY_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.label : categoryId || '문의';
};

// 문의 내용 마스킹 함수
const maskQuestionContent = (qna: QnA, isOwner: boolean): string => {
    // 본인 문의는 전체 표시
    if (isOwner) return qna.question;

    // 비공개 문의가 아니면 전체 표시
    if (!qna.is_private) return qna.question;

    // 비공개일 경우 카테고리 라벨만 표시, 없으면 '비공개 문의'
    if (qna.category) {
        return getCategoryLabel(qna.category);
    }

    return '비공개 문의입니다';
};

export default function ProductQnA({ productId }: ProductQnAProps) {
    const { user } = useAuth();
    const toast = useToast();
    const [qnas, setQnas] = useState<QnA[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [form, setForm] = useState({
        category: '' as InquiryCategoryId | '',
        question: '', // 기타 문의일 때만 사용
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
            .order('created_at', { ascending: false });

        if (data) {
            // 모든 문의를 표시 (내용은 마스킹 처리)
            setQnas(data);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        if (!form.category) {
            toast.error('문의 유형을 선택해주세요.');
            return;
        }

        // 기타 문의일 때만 내용 필수
        if (form.category === 'other' && !form.question.trim()) {
            toast.error('문의 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 질문 내용 구성: 카테고리 라벨 사용, 기타일 경우 사용자 입력 추가
            const categoryLabel = getCategoryLabel(form.category);
            const questionContent = form.category === 'other'
                ? `[${categoryLabel}] ${form.question.trim()}`
                : categoryLabel;

            const { error } = await supabase.from('product_qna').insert({
                product_id: productId,
                user_id: user.id,
                author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '익명',
                question: questionContent,
                is_private: true, // 모든 문의는 기본 비공개
                category: form.category
            });

            if (error) throw error;

            toast.success('문의가 등록되었습니다.');
            setForm({ category: '', question: '' });
            setIsWriteModalOpen(false);
            fetchQnA();
        } catch (error: any) {
            toast.error(error.message || '문의 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCategorySelect = (categoryId: InquiryCategoryId) => {
        setForm({ ...form, category: categoryId, question: '' });
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold tracking-widest">PRODUCT Q&A</h3>
                <button
                    onClick={() => user ? setIsWriteModalOpen(true) : toast.error('로그인이 필요합니다.')}
                    className="px-6 py-2.5 bg-[#00704A] text-white rounded-lg hover:bg-[#005A3C] transition-colors font-medium"
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
                <div className="space-y-2">
                    {qnas.map((qna) => (
                        <div key={qna.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setExpandedId(expandedId === qna.id ? null : qna.id)}
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    {/* 기타 문의이거나 본인 문의가 아닌 경우 자물쇠 표시 */}
                                    {(qna.category === 'other' || !qna.category) && (!user || user.id !== qna.user_id) && (
                                        <Lock className="w-4 h-4 text-gray-400" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">Q.</span>
                                            <span className="font-medium">
                                                {maskQuestionContent(qna, !!user && user.id === qna.user_id)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            {/* 이름 마스킹 적용 */}
                                            <span>{maskName(qna.author_name)}</span>
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

                            {/* 답변 표시 - 본인만 실제 내용 확인 가능 */}
                            {expandedId === qna.id && qna.answer && (
                                <div className="p-4 bg-[#F0FAF5] border-t border-gray-200">
                                    <div className="flex items-start gap-3">
                                        {/* 비공개 답변일 경우 자물쇠 아이콘 먼저 표시 */}
                                        {(!user || user.id !== qna.user_id) && (
                                            <Lock className="w-4 h-4 text-gray-400 mt-0.5" />
                                        )}
                                        <span className="font-semibold text-[#00704A]">A.</span>
                                        <div className="flex-1">
                                            {/* 본인만 답변 내용 확인 가능 */}
                                            {user && user.id === qna.user_id ? (
                                                <>
                                                    <p className="text-gray-800 whitespace-pre-wrap">{qna.answer}</p>
                                                    {qna.answered_at && (
                                                        <p className="text-sm text-gray-500 mt-2">
                                                            {new Date(qna.answered_at).toLocaleDateString('ko-KR')}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-gray-500">비공개 답변입니다. 로그인 후 본인 문의에서 확인하세요.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {expandedId === qna.id && !qna.answer && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-gray-500 text-sm">
                                    답변 대기 중입니다.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Write Modal - ESSENTIA 스타일 적용 */}
            {isWriteModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-card w-full max-w-md">
                        {/* Modal Header */}
                        <div className="admin-modal-header">
                            <h2>제품 문의</h2>
                            <button
                                onClick={() => {
                                    setIsWriteModalOpen(false);
                                    setForm({ category: '', question: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="admin-modal-body">
                            {/* Category Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">문의 유형 선택</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {INQUIRY_CATEGORIES.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => handleCategorySelect(category.id)}
                                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${form.category === category.id
                                                ? 'border-[#00704A] bg-[#F0FAF5]'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <span className={`font-medium ${form.category === category.id ? 'text-[#00704A]' : 'text-gray-700'
                                                }`}>
                                                {category.label}
                                            </span>
                                            {form.category === category.id && (
                                                <Check className="w-5 h-5 text-[#00704A]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Content Input - Only for 기타 문의 */}
                            {form.category === 'other' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">문의 내용</label>
                                    <textarea
                                        value={form.question}
                                        onChange={(e) => setForm({ ...form, question: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent h-32 resize-none"
                                        placeholder="궁금한 점을 자세히 작성해주세요."
                                    />
                                </div>
                            )}

                            {/* Privacy Notice */}
                            <div className="bg-[#F0FAF5] rounded-lg p-4 mb-6 border border-[#00704A]/20">
                                <div className="flex items-center gap-2 text-sm text-[#00704A]">
                                    <Lock className="w-4 h-4" />
                                    <span className="font-medium">모든 문의는 비공개로 처리됩니다.</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 ml-6">
                                    본인과 관리자만 확인할 수 있습니다.
                                </p>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsWriteModalOpen(false);
                                        setForm({ category: '', question: '' });
                                    }}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 admin-btn-primary disabled:bg-gray-400 font-medium"
                                    disabled={isSubmitting || !form.category}
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
