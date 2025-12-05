"use client";

import { useState, useEffect } from "react";
import { MessageSquareMore, ArrowUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function KakaoButton() {
    const [kakaoUrl, setKakaoUrl] = useState<string>("https://open.kakao.com/o/placeholder");

    useEffect(() => {
        const fetchKakaoUrl = async () => {
            try {
                const { data } = await supabase
                    .from('site_settings')
                    .select('kakao_url')
                    .eq('id', 1)
                    .single();

                if (data?.kakao_url) {
                    setKakaoUrl(data.kakao_url);
                }
            } catch (error) {
                console.error("Failed to fetch kakao URL:", error);
            }
        };
        fetchKakaoUrl();
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="fixed bottom-36 md:bottom-8 right-4 md:right-8 z-50 flex flex-col gap-2">
            {/* TOP Button */}
            <button
                onClick={scrollToTop}
                className="flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-lg hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] focus:bg-white focus:text-black focus:border-black active:bg-[#D4AF37] active:text-white transition-colors duration-300 cursor-pointer border border-black outline-none"
                aria-label="맨 위로"
            >
                <ArrowUp className="w-5 h-5 md:w-6 md:h-6 mb-0.5" />
                <span className="text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest">TOP</span>
            </button>

            {/* 문의 Button - 오픈채팅 링크 (관리자 설정에서 가져옴) */}
            <a
                href={kakaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-lg hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] focus:bg-white focus:text-black focus:border-black transition-colors duration-300 cursor-pointer border border-black outline-none"
                aria-label="문의하기"
            >
                <MessageSquareMore className="w-5 h-5 md:w-6 md:h-6 mb-0.5" />
                <span className="text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest">문의</span>
            </a>
        </div>
    );
}
