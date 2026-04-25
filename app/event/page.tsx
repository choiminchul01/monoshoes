"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EventItem = {
    id: string;
    image: string;
    title: string;
    subtitle?: string;
    category?: string;
    date: string;
    badge?: string;
    is_active: boolean;
};

const eventBanners = [
    { text: "신규 가입 시 3만원 할인 쿠폰팩 증정", bgColor: "bg-[#111111]", textColor: "text-white" },
    { text: "모노슈즈 카카오톡 친구 추가 시 7% 할인 쿠폰", bgColor: "bg-[#f5f5f5]", textColor: "text-black" }
];

const PAST_EVENTS: EventItem[] = [
    { id: "mock-6", image: "/images/event/97_27.jpg", title: "설맞이 쿠폰전", subtitle: "HAPPY NEW YEAR", category: "HOLIDAY", date: "2026.02.09 ~ 2026.02.19", badge: "/images/event/badge.jpg", is_active: false },
    { id: "mock-7", image: "/images/event/97_31.jpg", title: "설준비 쿠폰전", subtitle: "GIFT SET SALE", category: "HOLIDAY", date: "2026.01.26 ~ 2026.02.09", badge: "/images/event/badge.jpg", is_active: false },
    { id: "mock-8", image: "/images/event/97_35.jpg", title: "NEW YEAR 15% 쿠폰", subtitle: "2026 WELCOME", category: "NEW YEAR", date: "2026.01.02 ~ 2026.01.30", badge: "/images/event/badge.jpg", is_active: false },
    { id: "mock-9", image: "/images/event/97_39.jpg", title: "WINTER", subtitle: "WINTER SALE", category: "SEASON EVENT", date: "기간 2025.12.01 ~ 2025.12.31", badge: "/images/event/badge.jpg", is_active: false },
    { id: "mock-10", image: "/images/event/97_43.jpg", title: "쿠폰 위크", subtitle: "COUPON WEEK", category: "PROMOTION", date: "2025.11.03 ~ 2025.11.14", badge: "/images/event/badge.jpg", is_active: false },
    { id: "mock-11", image: "/images/event/97_47.jpg", title: "추석맞이 쿠폰 FESTA", subtitle: "THANKSGIVING", category: "HOLIDAY", date: "2025.10.01 ~ 2025.10.13", badge: "/images/event/badge.jpg", is_active: false },
    { id: "mock-12", image: "/images/event/97_51.jpg", title: "9월 슈즈 데이", subtitle: "SHOES DAY", category: "BRAND DAY", date: "기간 2025.09.01 ~ 2025.09.30", badge: "/images/event/badge.jpg", is_active: false },
    { id: "mock-13", image: "/images/event/97_55.jpg", title: "S/S 시즌 오프", subtitle: "FINAL SALE", category: "SEASON OFF", date: "기간 2025.09.01 ~ 2025.09.30", badge: "/images/event/badge.jpg", is_active: false }
];

export default function EventPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from('events')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            const dbEvents: EventItem[] = (data || []).map(row => {
                const startStr = row.start_date ? row.start_date.split('T')[0].replace(/-/g, '.') : '';
                const endStr = row.end_date ? row.end_date.split('T')[0].replace(/-/g, '.') : '';
                return {
                    id: row.id,
                    image: row.image_url || '/images/event/event_bg_1.png',
                    title: row.title,
                    subtitle: row.description || '',
                    category: 'SPECIAL EVENT',
                    date: `${startStr} ~ ${endStr}`,
                    badge: '/images/event/badge.jpg',
                    is_active: true
                };
            });

            // 관리자 DB 이벤트와 기존 만료된 목업 이벤트를 합침
            setEvents([...dbEvents, ...PAST_EVENTS]);
            setIsLoading(false);
        };
        fetchEvents();
    }, []);

    return (
        <div className="w-full">
            {/* Top Promotion Banners */}
            <div className="w-full">
                {eventBanners.map((banner, idx) => (
                    <div key={idx} className={`w-full py-3 flex items-center justify-center ${banner.bgColor}`}>
                        <p className={`text-sm tracking-wide font-medium ${banner.textColor}`}>
                            {banner.text}
                        </p>
                    </div>
                ))}
            </div>

            <div className="max-w-[1400px] mx-auto px-4 py-20">
                <div className="mb-16 text-center">
                    <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">Special Event</p>
                    <div className="inline-block">
                        <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                            EVENT
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-16">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center text-gray-400">Loading events...</div>
                    ) : events.map((event, index) => {
                        const CardContent = (
                            <div className={`flex flex-col h-full ${event.is_active ? 'group' : ''}`}>
                                <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden mb-5">
                                    <Image
                                        src={event.image}
                                        alt={event.title}
                                        fill
                                        unoptimized
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                    />
                                    {/* Text Overlay */}
                                    <div className="absolute inset-0 flex flex-col justify-start p-8 transition-all duration-500 bg-gradient-to-b from-black/80 via-black/20 to-transparent group-hover:from-black/90">
                                        <div className="flex flex-col items-start text-left">
                                            <p className="text-white/80 text-[10px] tracking-[0.3em] mb-2 uppercase font-bold">
                                                {event.category || "SPECIAL EVENT"}
                                            </p>
                                            <h4 className="text-white text-[22px] font-black tracking-tight mb-5 leading-tight drop-shadow-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
                                                {event.title}
                                            </h4>
                                            {event.subtitle && (
                                                <p className="text-white text-[15px] font-bold tracking-[0.1em] drop-shadow-lg leading-snug">
                                                    {event.subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col flex-grow px-1">
                                    <p className="text-[12px] text-[#A3A3A3] font-medium tracking-wide mb-3">
                                        {event.date}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                        {event.is_active ? (
                                            event.badge && (
                                                <div className="relative w-[50px] h-[20px] opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Image
                                                        src={event.badge}
                                                        alt="Badge"
                                                        fill
                                                        unoptimized
                                                        className="object-contain"
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex items-center justify-center w-[54px] h-[20px] bg-[#999999] text-white text-[10px] font-medium tracking-tight">
                                                기간만료
                                            </div>
                                        )}
                                        {event.is_active && (
                                            <div className="w-8 h-[1px] bg-gray-100 group-hover:w-12 group-hover:bg-black transition-all duration-300 ml-auto"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05, duration: 0.6 }}
                                className={event.is_active ? 'cursor-pointer' : 'cursor-default'}
                            >
                                {event.is_active ? (
                                    <Link href={`/event/${event.id}`}>
                                        {CardContent}
                                    </Link>
                                ) : (
                                    <div>
                                        {CardContent}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
