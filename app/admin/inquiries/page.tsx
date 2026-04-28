"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, MessageCircle, CheckCircle, Clock, X, Send, ShoppingBag, HelpCircle } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";

type Inquiry = {
    id: string;
    title: string;
    content: string;
    status: 'pending' | 'answered';
    answer: string | null;
    created_at: string;
    answered_at: string | null;
    user: {
        email: string;
    } | null;
    author_name?: string;
};

type ProductQnA = {
    id: string;
    product_id: string;
    user_id: string;
    author_name: string;
    question: string;
    answer: string | null;
    is_private: boolean;
    is_answered: boolean;
    status: 'pending' | 'answered';
    created_at: string;
    answered_at: string | null;
    product: {
        name: string;
        image_url: string;
    } | null;
    user: {
        email: string;
    } | null;
};

export default function AdminInquiriesPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'inquiry' | 'product_qna'>('inquiry');

    // Data States
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [productQnAs, setProductQnAs] = useState<ProductQnA[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Detail Modal State
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [selectedQnA, setSelectedQnA] = useState<ProductQnA | null>(null);
    const [answerText, setAnswerText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (activeTab === 'inquiry') {
            fetchInquiries();
        } else {
            fetchProductQnAs();
        }
    }, [currentPage, filter, activeTab]);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            // Use the View instead of Table to get user_email
            let query = supabase
                .from("admin_general_qna_view")
                .select("*")
                .order("created_at", { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (filter === 'pending') {
                query = query.eq('is_answered', false);
            } else if (filter === 'answered') {
                query = query.eq('is_answered', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Map view data to Inquiry type
            const mappedData = data?.map(item => ({
                id: item.id,
                title: item.title,
                content: item.content,
                status: item.is_answered ? 'answered' : 'pending',
                answer: item.answer,
                created_at: item.created_at,
                answered_at: item.answered_at,
                user: {
                    email: item.user_email || "알 수 없음"
                },
                author_name: item.author_name
            })) || [];

            setInquiries(mappedData as Inquiry[]);
        } catch (error) {
            console.error("Error fetching inquiries:", error);
            toast.error("문의 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const fetchProductQnAs = async () => {
        setLoading(true);
        try {
            // Use the View instead of Table
            let query = supabase
                .from("admin_product_qna_view")
                .select("*")
                .order("created_at", { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (filter === 'pending') {
                query = query.eq('is_answered', false);
            } else if (filter === 'answered') {
                query = query.eq('is_answered', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Map view data to ProductQnA type
            const mappedData = data?.map(item => ({
                id: item.id,
                product_id: item.product_id,
                user_id: item.user_id,
                author_name: item.author_name,
                question: item.question,
                answer: item.answer,
                is_private: item.is_private,
                is_answered: !!item.is_answered,
                status: item.is_answered ? 'answered' : 'pending',
                created_at: item.created_at,
                answered_at: item.answered_at,
                product: {
                    name: item.product_name,
                    image_url: item.product_image_url
                },
                user: {
                    email: item.user_email || "알 수 없음"
                }
            })) || [];

            setProductQnAs(mappedData as ProductQnA[]);
        } catch (error) {
            console.error("Error fetching product Q&As:", error);
            toast.error("상품 Q&A 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenInquiry = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setAnswerText(inquiry.answer || "");
    };

    const handleOpenQnA = (qna: ProductQnA) => {
        setSelectedQnA(qna);
        setAnswerText(qna.answer || "");
    };

    const handleSubmitAnswer = async () => {
        if (!answerText.trim()) return;

        setIsSubmitting(true);
        try {
            if (activeTab === 'inquiry' && selectedInquiry) {
                // Update the actual table, not the view
                const { error } = await supabase
                    .from("general_qna")
                    .update({
                        answer: answerText,
                        is_answered: true,
                        answered_at: new Date().toISOString()
                    })
                    .eq("id", selectedInquiry.id);

                if (error) throw error;
                toast.success("답변이 등록되었습니다.");
                setSelectedInquiry(null);
                fetchInquiries();
            } else if (activeTab === 'product_qna' && selectedQnA) {
                const { error } = await supabase
                    .from("product_qna")
                    .update({
                        answer: answerText,
                        is_answered: true,
                        answered_at: new Date().toISOString()
                    })
                    .eq("id", selectedQnA.id);

                if (error) throw error;
                toast.success("답변이 등록되었습니다.");
                setSelectedQnA(null);
                fetchProductQnAs();
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            toast.error("답변 등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            {/* Title Row */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">문의 관리</h1>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg inline-flex mb-6">
                <button
                    onClick={() => { setActiveTab('inquiry'); setCurrentPage(1); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'inquiry'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <HelpCircle className="w-4 h-4" />
                    1:1 문의
                </button>
                <button
                    onClick={() => { setActiveTab('product_qna'); setCurrentPage(1); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'product_qna'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    상품 Q&A
                </button>
            </div>

            {/* Filter Buttons Row */}
            <div className="mb-6">
                <div className="flex bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        전체
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'pending' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        대기중
                    </button>
                    <button
                        onClick={() => setFilter('answered')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'answered' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        답변완료
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {activeTab === 'inquiry' ? (
                                <>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상품 정보</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">문의 내용</th>
                                </>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">로딩 중...</td></tr>
                        ) : (activeTab === 'inquiry' ? inquiries.length === 0 : productQnAs.length === 0) ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">문의 내역이 없습니다.</td></tr>
                        ) : (
                            activeTab === 'inquiry' ? (
                                inquiries.map((inquiry) => (
                                    <tr
                                        key={inquiry.id}
                                        onClick={() => handleOpenInquiry(inquiry)}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{inquiry.author_name || "익명"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 truncate max-w-md">{inquiry.title}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {inquiry.user?.email || "알 수 없음"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inquiry.status === 'answered' ? (
                                                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" /> 답변완료
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
                                                    <Clock className="w-4 h-4" /> 대기중
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(inquiry.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                productQnAs.map((qna) => (
                                    <tr
                                        key={qna.id}
                                        onClick={() => handleOpenQnA(qna)}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {qna.product?.image_url && (
                                                    <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                        <Image src={qna.product.image_url} alt={qna.product.name} fill className="object-cover" />
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium truncate max-w-[150px]">
                                                    {qna.product?.name || "삭제된 상품"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 truncate max-w-md">{qna.question}</div>
                                            {qna.is_private && <span className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> 비공개</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div>{qna.author_name}</div>
                                            <div className="text-xs text-gray-400">{qna.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {qna.status === 'answered' ? (
                                                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                    <CheckCircle className="w-4 h-4" /> 답변완료
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
                                                    <Clock className="w-4 h-4" /> 대기중
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(qna.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {/* Inquiry Detail Modal */}
            {(selectedInquiry || selectedQnA) && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-card w-full max-w-2xl">
                        <div className="admin-modal-header flex-col items-start gap-2">
                            <div className="w-full flex justify-between items-start">
                                <div>
                                    {selectedInquiry ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                                                    일반문의
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(selectedInquiry.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <h2 className="text-xl font-bold">{selectedInquiry.title}</h2>
                                            <p className="text-sm text-gray-500 mt-1">작성자: {selectedInquiry.author_name} ({selectedInquiry.user?.email})</p>
                                        </>
                                    ) : selectedQnA && (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                                    상품문의
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(selectedQnA.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-2">
                                                {selectedQnA.product?.image_url && (
                                                    <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                                                        <Image src={selectedQnA.product.image_url} alt={selectedQnA.product.name} fill className="object-cover" />
                                                    </div>
                                                )}
                                                <h2 className="text-lg font-bold">{selectedQnA.product?.name}</h2>
                                            </div>
                                            <p className="text-sm text-gray-500">작성자: {selectedQnA.author_name} ({selectedQnA.user?.email})</p>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setSelectedInquiry(null); setSelectedQnA(null); }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="admin-modal-body space-y-6">
                            {/* Content */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                    {selectedInquiry ? selectedInquiry.content : selectedQnA?.question}
                                </p>
                            </div>

                            {/* Answer Section */}
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5" />
                                    관리자 답변
                                </h3>
                                <textarea
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00704A] focus:border-transparent h-40 resize-none mb-3"
                                    placeholder="답변 내용을 입력하세요..."
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => { setSelectedInquiry(null); setSelectedQnA(null); }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        닫기
                                    </button>
                                    <button
                                        onClick={handleSubmitAnswer}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-6 py-2 admin-btn-primary disabled:bg-gray-400"
                                    >
                                        <Send className="w-4 h-4" />
                                        {isSubmitting ? "등록 중..." : "답변 등록"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
