"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { HelpCircle, ShoppingBag, ChevronDown, ChevronUp, MessageCircle, Clock, CheckCircle, ArrowLeft, PenSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type GeneralInquiry = {
    id: string;
    title: string;
    content: string;
    answer: string | null;
    is_answered: boolean;
    created_at: string;
    answered_at: string | null;
};

type ProductQnA = {
    id: string;
    product_id: string;
    question: string;
    answer: string | null;
    is_answered: boolean;
    created_at: string;
    answered_at: string | null;
    product: {
        id: string;
        name: string;
        image_url: string; // Note: We'll handle the array logic in fetch
    } | null;
};

export default function MyInquiriesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'product'>('general');

    const [generalInquiries, setGeneralInquiries] = useState<GeneralInquiry[]>([]);
    const [productQnAs, setProductQnAs] = useState<ProductQnA[]>([]);
    const [loading, setLoading] = useState(true);

    // Expanded state for accordion
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirectTo=/mypage/inquiries');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            if (activeTab === 'general') {
                fetchGeneralInquiries();
            } else {
                fetchProductQnAs();
            }
        }
    }, [user, activeTab]);

    const fetchGeneralInquiries = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('general_qna')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGeneralInquiries(data || []);
        } catch (error) {
            console.error("Error fetching general inquiries:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductQnAs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('product_qna')
                .select('*, product:product_id(id, name, images)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to handle product images array
            const formattedData = data?.map(item => ({
                ...item,
                product: item.product ? {
                    ...item.product,
                    image_url: item.product.images && item.product.images.length > 0 ? item.product.images[0] : null
                } : null
            })) || [];

            setProductQnAs(formattedData as ProductQnA[]);
        } catch (error) {
            console.error("Error fetching product Q&As:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/mypage" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold">나의 문의내역</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-lg inline-flex mb-6 shadow-sm border border-gray-200">
                    <button
                        onClick={() => { setActiveTab('general'); setExpandedId(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-bold transition-all ${activeTab === 'general'
                                ? 'bg-black text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <HelpCircle className="w-4 h-4" />
                        1:1 문의
                    </button>
                    <button
                        onClick={() => { setActiveTab('product'); setExpandedId(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-bold transition-all ${activeTab === 'product'
                                ? 'bg-black text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        상품 Q&A
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            문의 내역을 불러오는 중...
                        </div>
                    ) : (activeTab === 'general' ? generalInquiries.length === 0 : productQnAs.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                            <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">작성한 문의가 없습니다.</h3>
                            <p className="text-gray-500 mb-6">궁금한 점이 있으시면 언제든지 문의해주세요.</p>
                            {activeTab === 'general' && (
                                <Link
                                    href="/board/qna"
                                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <PenSquare className="w-4 h-4" />
                                    문의 작성하기
                                </Link>
                            )}
                            {activeTab === 'product' && (
                                <Link
                                    href="/shop"
                                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    상품 보러가기
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {activeTab === 'general' ? (
                                generalInquiries.map((inquiry) => (
                                    <div key={inquiry.id} className="group">
                                        <button
                                            onClick={() => toggleExpand(inquiry.id)}
                                            className="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {inquiry.is_answered ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <CheckCircle className="w-3 h-3" /> 답변완료
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            <Clock className="w-3 h-3" /> 답변대기
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(inquiry.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h3 className="font-medium text-gray-900 group-hover:text-black transition-colors">
                                                    {inquiry.title}
                                                </h3>
                                            </div>
                                            {expandedId === inquiry.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </button>

                                        {/* Expanded Content */}
                                        {expandedId === inquiry.id && (
                                            <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                                                <div className="pt-4">
                                                    <div className="flex gap-3 mb-4">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">Q</div>
                                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{inquiry.content}</p>
                                                    </div>

                                                    {inquiry.answer && (
                                                        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                                                            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">A</div>
                                                            <div className="flex-1">
                                                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{inquiry.answer}</p>
                                                                {inquiry.answered_at && (
                                                                    <p className="text-xs text-gray-400 mt-2">
                                                                        {new Date(inquiry.answered_at).toLocaleDateString()} 답변됨
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                productQnAs.map((qna) => (
                                    <div key={qna.id} className="group">
                                        <button
                                            onClick={() => toggleExpand(qna.id)}
                                            className="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    {qna.product?.image_url ? (
                                                        <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                                            <Image src={qna.product.image_url} alt={qna.product.name} fill className="object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">{qna.product?.name || "상품 정보 없음"}</p>
                                                        <div className="flex items-center gap-2">
                                                            {qna.is_answered ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                                                    답변완료
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                                                    답변대기
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(qna.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <h3 className="font-medium text-gray-900 group-hover:text-black transition-colors line-clamp-1">
                                                    {qna.question}
                                                </h3>
                                            </div>
                                            {expandedId === qna.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400 mt-2" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400 mt-2" />
                                            )}
                                        </button>

                                        {/* Expanded Content */}
                                        {expandedId === qna.id && (
                                            <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                                                <div className="pt-4">
                                                    <div className="flex gap-3 mb-4">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">Q</div>
                                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{qna.question}</p>
                                                    </div>

                                                    {qna.answer && (
                                                        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                                                            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">A</div>
                                                            <div className="flex-1">
                                                                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{qna.answer}</p>
                                                                {qna.answered_at && (
                                                                    <p className="text-xs text-gray-400 mt-2">
                                                                        {new Date(qna.answered_at).toLocaleDateString()} 답변됨
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
