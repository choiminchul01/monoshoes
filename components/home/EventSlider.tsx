"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const events = [
    { id: "1", image: "/images/event/event_bg_1.png", title: "쇼핑위크", subtitle: "쿠폰 UP TO 10%", category: "SHOPPING WEEK", date: "2026.03.25 ~ 2026.04.30", badge: "/images/event/badge.jpg", is_active: true },
    { id: "2", image: "/images/event/event_bg_2.png", title: "26SS 커리우먼 NEW", subtitle: "15% COUPON", category: "NEW ARRIVAL", date: "2026.04.20 ~ 2026.05.04", badge: "/images/event/badge.jpg", is_active: true },
    { id: "3", image: "/images/event/event_bg_3.png", title: "봄맞이 특별할인", subtitle: "SEASON START SALE", category: "SEASON EVENT", date: "2026.02.23 ~ 2026.03.31", badge: "/images/event/badge.jpg", is_active: true },
    { id: "4", image: "/images/event/event_bg_4.png", title: "토스페이 프로모션", subtitle: "5% CASHBACK", category: "PROMOTION", date: "2025.09.17 ~ 2026.03.17", badge: "/images/event/badge.jpg", is_active: true },
    { id: "5", image: "/images/event/event_bg_5.png", title: "시즌오프", subtitle: "MAX 50% OFF", category: "SEASON OFF", date: "2026.02.06 ~ 2026.02.27", badge: "/images/event/badge.jpg", is_active: true },
];

export default function EventSlider() {
    const [isPaused, setIsPaused] = useState(false);

    // 무한 스크롤을 위해 배열 복제
    const duplicatedEvents = [...events, ...events, ...events, ...events];

    return (
        <section className="py-24 bg-[#FAFAFA]">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="text-center mb-16">
                    <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">EXCLUSIVE</p>
                    <div className="inline-block">
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                            EVENT
                        </h2>
                        <div className="w-full h-[2px] bg-black mx-auto"></div>
                    </div>
                </div>

                <div
                    className="relative overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 pt-16"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* View All Link - Top Right */}
                    <div className="absolute top-6 right-10 z-20">
                        <Link href="/event" className="flex items-center gap-2 text-[11px] font-black text-gray-300 hover:text-black transition-all group/link uppercase tracking-widest">
                            View All 
                            <div className="w-6 h-[1px] bg-gray-200 group-hover/link:w-10 group-hover/link:bg-black transition-all"></div>
                        </Link>
                    </div>
                    <div
                        className="flex gap-10"
                        style={{
                            width: 'max-content',
                            animation: 'eventScroll 80s linear infinite',
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                    >
                        {duplicatedEvents.map((event, index) => {
                            const CardContent = (
                                <div className="flex flex-col h-full w-[240px] md:w-[280px] group/card">
                                    <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden mb-6 rounded-xl shadow-sm">
                                        <Image
                                            src={event.image}
                                            alt={event.title}
                                            fill
                                            unoptimized
                                            className={`object-cover transition-transform duration-1000 ease-out ${event.is_active ? 'group-hover/card:scale-110' : ''}`}
                                        />
                                        {/* Text Overlay */}
                                        <div className={`absolute inset-0 flex flex-col justify-end p-6 transition-all duration-500 ${event.is_active ? 'bg-gradient-to-t from-black/90 via-black/20 to-transparent' : 'bg-black/60 grayscale'}`}>
                                            <div className="flex flex-col items-start text-left">
                                                <p className="text-white/70 text-[9px] tracking-[0.3em] mb-1.5 uppercase font-bold">
                                                    {event.category}
                                                </p>
                                                <h4 className="text-white text-lg font-black tracking-tight mb-2 leading-tight">
                                                    {event.title}
                                                </h4>
                                                {event.subtitle && (
                                                    <>
                                                        <div className="h-[1.5px] w-6 bg-white/50 mb-3" />
                                                        <p className="text-white/90 text-[13px] font-bold tracking-wide">
                                                            {event.subtitle}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col px-2">
                                        <p className="text-[11px] text-gray-400 font-bold tracking-widest mb-1">
                                            {event.date}
                                        </p>
                                        <div className="w-0 h-[2px] bg-black group-hover/card:w-full transition-all duration-500"></div>
                                    </div>
                                </div>
                            );

                            return (
                                <div key={`${event.id}-${index}`} className={`flex-shrink-0 ${event.is_active ? 'cursor-pointer' : 'cursor-default'}`}>
                                    {event.is_active ? (
                                        <Link href={`/event`}>
                                            {CardContent}
                                        </Link>
                                    ) : (
                                        <div>
                                            {CardContent}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* 내부 좌우 그라데이션 페이드 */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
                </div>
            </div>

            {/* 슬라이드 애니메이션 CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes eventScroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-33.333%); }
                    }
                `
            }} />
        </section>
    );
}
