"use client";

import { MessageCircle } from "lucide-react";

export function KakaoButton() {
    return (
        <a
            href="https://open.kakao.com/o/placeholder" // Replace with actual link
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-50 flex flex-col items-center justify-center w-16 h-16 bg-[#FDFCF5] rounded-full shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer border border-black"
            aria-label="KakaoTalk Consultation"
        >
            <div className="relative flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-black fill-current" />
                <span className="absolute text-[0.7rem] font-extrabold text-[#FAF0E6] tracking-tighter pt-1">TALK</span>
            </div>
        </a>
    );
}
