"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquareMore, ArrowUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function KakaoButton() {
    const [kakaoUrl, setKakaoUrl] = useState<string>("https://open.kakao.com/o/placeholder");
    const pathname = usePathname();

    // 상품상세 페이지인지 확인 (/shop/[id] 패턴)
    const isProductDetailPage = pathname?.startsWith('/shop/') && pathname !== '/shop';

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

    // 모바일에서 상품상세 페이지일 때만 bottom-24 (하단 액션바 위)
    // 그 외에는 PC와 동일하게 bottom-8
    const positionClass = isProductDetailPage
        ? "fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 flex flex-col gap-2"
        : "fixed bottom-8 right-4 md:right-8 z-50 flex flex-col gap-2";

    return (
        <div className={positionClass}>
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
