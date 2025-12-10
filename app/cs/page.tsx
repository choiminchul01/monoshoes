"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";

type Notice = {
    id: string;
    title: string;
    content: string;
    is_important: boolean;
    created_at: string;
};

export default function NoticePage() {
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

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-10 text-center">
                <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Customer Service</p>
                <h1 className="text-3xl font-bold tracking-widest" style={{ fontFamily: "'S-Core Dream', sans-serif" }}>공지사항</h1>
                <p className="mt-4 text-sm text-gray-500">에센시아의 새로운 소식과 중요 안내사항을 확인하세요</p>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : notices.length === 0 ? (
                <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notices.map((notice) => (
                        <div key={notice.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    {notice.is_important && (
                                        <span className="text-red-500 text-xs font-bold border border-red-200 px-2 py-0.5 rounded">
                                            필독
                                        </span>
                                    )}
                                    <span className="font-medium">{notice.title}</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-400 text-sm">
                                    <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                                    {expandedId === notice.id ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </div>
                            </button>
                            {expandedId === notice.id && (
                                <div className="p-6 bg-gray-50 border-t border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {notice.content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
