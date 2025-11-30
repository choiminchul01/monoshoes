"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, MessageCircle, CheckCircle, Clock, X, Send } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";

type Inquiry = {
    id: string;
    type: 'general' | 'request';
    title: string;
    content: string;
    image_url: string | null;
    status: 'pending' | 'answered';
    answer: string | null;
    created_at: string;
    answered_at: string | null;
    user: {
        email: string;
    } | null;
};

export default function AdminInquiriesPage() {
    const toast = useToast();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Detail Modal State
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [answerText, setAnswerText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, [currentPage, filter]);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("inquiries")
                .select(`
                    *,
                    user:user_id (email)
                `)
                .order("created_at", { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setInquiries(data as any[] || []);
        } catch (error) {
            console.error("Error fetching inquiries:", error);
            toast.error("문의 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDetail = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setAnswerText(inquiry.answer || "");
    };

    const handleSubmitAnswer = async () => {
        if (!selectedInquiry || !answerText.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("inquiries")
                .update({
                    answer: answerText,
                    status: 'answered',
                    answered_at: new Date().toISOString()
                })
                .eq("id", selectedInquiry.id);

            if (error) throw error;

            toast.success("답변이 등록되었습니다.");
            setSelectedInquiry(null);
            fetchInquiries();
        } catch (error) {
            console.error("Error submitting answer:", error);
            toast.error("답변 등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">문의 관리</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        전체
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        대기중
                    </button>
                    <button
                        onClick={() => setFilter('answered')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'answered' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        답변완료
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">로딩 중...</td></tr>
                        ) : inquiries.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">문의 내역이 없습니다.</td></tr>
                        ) : (
                            inquiries.map((inquiry) => (
                                <tr
                                    key={inquiry.id}
                                    onClick={() => handleOpenDetail(inquiry)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        {inquiry.type === 'request' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                제품요청
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                일반문의
                                            </span>
                                        )}
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
                        )}
                    </tbody>
                </table>
            </div>

            {/* Inquiry Detail Modal */}
            {selectedInquiry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    {selectedInquiry.type === 'request' ? (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                            제품요청
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                                            일반문의
                                        </span>
                                    )}
                                    <span className="text-sm text-gray-500">
                                        {new Date(selectedInquiry.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold">{selectedInquiry.title}</h2>
                                <p className="text-sm text-gray-500 mt-1">작성자: {selectedInquiry.user?.email}</p>
                            </div>
                            <button onClick={() => setSelectedInquiry(null)} className="text-gray-400 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Inquiry Content */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                    {selectedInquiry.content}
                                </p>
                                {selectedInquiry.image_url && (
                                    <div className="mt-4">
                                        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                                            <Image
                                                src={selectedInquiry.image_url}
                                                alt="첨부 이미지"
                                                fill
                                                className="object-contain bg-white"
                                            />
                                        </div>
                                    </div>
                                )}
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
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent h-40 resize-none mb-3"
                                    placeholder="답변 내용을 입력하세요..."
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setSelectedInquiry(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        닫기
                                    </button>
                                    <button
                                        onClick={handleSubmitAnswer}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
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
