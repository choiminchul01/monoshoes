"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, ChevronUp, Search, Lock, MessageCircle, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";

// Types
type Notice = {
    id: string;
    title: string;
    content: string;
    is_important: boolean;
    created_at: string;
};

type FAQ = {
    id: string;
    category: string;
    question: string;
    answer: string;
};

type Inquiry = {
    id: string;
    type: 'general' | 'request';
    title: string;
    content: string;
    status: 'pending' | 'answered';
    answer: string | null;
    created_at: string;
    image_url: string | null;
};

function CustomerServiceContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const toast = useToast();

    const initialTab = searchParams.get("tab") || "notice";
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.push(`/cs?tab=${tab}`, { scroll: false });
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold text-center mb-10 tracking-widest">CUSTOMER SERVICE</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => handleTabChange("notice")}
                    className={`flex-1 py-4 text-sm font-medium tracking-wider transition-colors border-b-2 ${activeTab === "notice" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                    NOTICE
                </button>
                <button
                    onClick={() => handleTabChange("faq")}
                    className={`flex-1 py-4 text-sm font-medium tracking-wider transition-colors border-b-2 ${activeTab === "faq" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                    FAQ
                </button>
                <button
                    onClick={() => handleTabChange("inquiry")}
                    className={`flex-1 py-4 text-sm font-medium tracking-wider transition-colors border-b-2 ${activeTab === "inquiry" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                    1:1 INQUIRY
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === "notice" && <NoticeTab />}
                {activeTab === "faq" && <FaqTab />}
                {activeTab === "inquiry" && <InquiryTab user={user} />}
            </div>
        </div>
    );
}

function NoticeTab() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotices = async () => {
            const { data } = await supabase
                .from("notices")
                .select("*")
                .order("is_important", { ascending: false })
                .order("created_at", { ascending: false });
            setNotices(data || []);
            setLoading(false);
        };
        fetchNotices();
    }, []);

    if (loading) return <div className="text-center py-10 text-gray-400">Loading...</div>;

    return (
        <div className="space-y-4">
            {notices.length === 0 ? (
                <div className="text-center py-10 text-gray-500">등록된 공지사항이 없습니다.</div>
            ) : (
                notices.map((notice) => (
                    <div key={notice.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                {notice.is_important && <span className="text-red-500 text-xs font-bold border border-red-200 px-2 py-0.5 rounded">필독</span>}
                                <span className="font-medium">{notice.title}</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-400 text-sm">
                                <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                                {expandedId === notice.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </button>
                        {expandedId === notice.id && (
                            <div className="p-6 bg-gray-50 border-t border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {notice.content}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

function FaqTab() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            let query = supabase.from("faqs").select("*").order("display_order", { ascending: true });
            if (category !== "all") {
                query = query.eq("category", category);
            }
            const { data } = await query;
            setFaqs(data || []);
            setLoading(false);
        };
        fetchFaqs();
    }, [category]);

    const categories = [
        { id: "all", label: "전체" },
        { id: "delivery", label: "배송" },
        { id: "order", label: "주문/결제" },
        { id: "product", label: "상품" },
        { id: "return", label: "반품/교환" },
    ];

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${category === cat.id ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : faqs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">등록된 FAQ가 없습니다.</div>
            ) : (
                <div className="space-y-3">
                    {faqs.map((faq) => (
                        <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400 text-sm font-medium w-16">
                                        {faq.category === 'delivery' ? '배송' :
                                            faq.category === 'order' ? '주문' :
                                                faq.category === 'product' ? '상품' :
                                                    faq.category === 'return' ? '반품' : '기타'}
                                    </span>
                                    <span className="font-medium">Q. {faq.question}</span>
                                </div>
                                {expandedId === faq.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>
                            {expandedId === faq.id && (
                                <div className="p-6 bg-gray-50 border-t border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    <span className="font-bold text-black mr-2">A.</span>
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function InquiryTab({ user }: { user: any }) {
    const toast = useToast();
    const [view, setView] = useState<'list' | 'write'>('list');
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [form, setForm] = useState({
        type: 'general' as 'general' | 'request',
        title: '',
        content: '',
        image: null as File | null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user && view === 'list') {
            fetchInquiries();
        }
    }, [user, view]);

    const fetchInquiries = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("inquiries")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        setInquiries(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.content) {
            toast.error("제목과 내용을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = null;
            if (form.image) {
                const fileExt = form.image.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('inquiry-images')
                    .upload(fileName, form.image);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('inquiry-images').getPublicUrl(fileName);
                imageUrl = publicUrl;
            }

            const { error } = await supabase.from("inquiries").insert({
                user_id: user.id,
                type: form.type,
                title: form.title,
                content: form.content,
                image_url: imageUrl
            });

            if (error) throw error;
            toast.success("문의가 등록되었습니다.");
            setForm({ type: 'general', title: '', content: '', image: null });
            setView('list');
        } catch (error) {
            console.error(error);
            toast.error("문의 등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
                <Lock className="w-10 h-10 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">로그인이 필요한 서비스입니다.</h3>
                <p className="text-gray-500 mb-6">1:1 문의를 이용하시려면 로그인이 필요합니다.</p>
                <a href="/login" className="inline-block px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors">
                    로그인하기
                </a>
            </div>
        );
    }

    if (view === 'write') {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">문의 작성</h2>
                    <button onClick={() => setView('list')} className="text-gray-500 hover:text-black">
                        목록으로 돌아가기
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">문의 유형</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-colors ${form.type === 'general' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="general"
                                    checked={form.type === 'general'}
                                    onChange={() => setForm({ ...form, type: 'general' })}
                                    className="w-4 h-4 text-black focus:ring-black"
                                />
                                <span className="font-medium">일반 문의</span>
                            </label>
                            <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex items-center gap-3 transition-colors ${form.type === 'request' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="request"
                                    checked={form.type === 'request'}
                                    onChange={() => setForm({ ...form, type: 'request' })}
                                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                />
                                <div>
                                    <span className="font-medium block text-purple-900">제품 찾아줘 (Request)</span>
                                    <span className="text-xs text-purple-700">원하시는 상품을 찾아드립니다.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {form.type === 'request' && (
                        <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800 leading-relaxed">
                            <strong>[제품 요청 안내]</strong><br />
                            찾으시는 상품의 브랜드, 상품명, 사진 등을 첨부해주시면 더욱 정확한 안내가 가능합니다.<br />
                            최대한 빠른 시일 내에 재고 확인 후 답변 드리겠습니다.
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">제목</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                            placeholder="제목을 입력하세요"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">내용</label>
                        <textarea
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black h-48 resize-none"
                            placeholder="문의 내용을 자세히 적어주세요."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">이미지 첨부 (선택)</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <ImageIcon className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-600">이미지 선택</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setForm({ ...form, image: e.target.files[0] });
                                        }
                                    }}
                                />
                            </label>
                            {form.image && (
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                    <span className="text-sm text-gray-600 truncate max-w-[200px]">{form.image.name}</span>
                                    <button onClick={() => setForm({ ...form, image: null })} className="text-gray-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-black text-white font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                    >
                        {isSubmitting ? "등록 중..." : "문의 등록하기"}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">나의 문의 내역</h2>
                <button
                    onClick={() => setView('write')}
                    className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    문의하기
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : inquiries.length === 0 ? (
                <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
                    <MessageCircle className="w-10 h-10 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">문의 내역이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                        <div key={inquiry.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    {inquiry.type === 'request' ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">제품요청</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">일반문의</span>
                                    )}
                                    <span className="text-sm text-gray-400">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                                </div>
                                {inquiry.status === 'answered' ? (
                                    <span className="text-green-600 text-sm font-bold">답변완료</span>
                                ) : (
                                    <span className="text-gray-400 text-sm font-medium">답변대기</span>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-2">{inquiry.title}</h3>
                            <p className="text-gray-600 whitespace-pre-wrap mb-4">{inquiry.content}</p>
                            {inquiry.image_url && (
                                <div className="mb-4 relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                                    <Image src={inquiry.image_url} alt="첨부 이미지" fill className="object-cover" />
                                </div>
                            )}
                            {inquiry.answer && (
                                <div className="bg-gray-50 p-4 rounded-lg border-t border-gray-100 mt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold text-black">ESSENTIA</span>
                                        <span className="text-xs text-gray-400">관리자 답변</span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{inquiry.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CustomerServicePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <CustomerServiceContent />
        </Suspense>
    );
}
