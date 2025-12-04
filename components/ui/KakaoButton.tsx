"use client";

import { MessageSquareMore } from "lucide-react";

export function KakaoButton() {
    return (
        <a
            href="https://open.kakao.com/o/placeholder" // Replace with actual link
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-50 flex flex-col items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg hover:bg-black hover:text-white transition-colors duration-300 cursor-pointer border border-black group"
            aria-label="문의하기"
        >
            <MessageSquareMore className="w-6 h-6 mb-1" />
            <span className="text-[0.6rem] font-bold tracking-widest">문의</span>
        </a>
    );
}
