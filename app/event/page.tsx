"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const eventBanners = [
    { text: "신규 가입 시 3만원 할인 쿠폰팩 증정", bgColor: "bg-[#111111]", textColor: "text-white" },
    { text: "모노슈즈 카카오톡 친구 추가 시 7% 할인 쿠폰", bgColor: "bg-[#f5f5f5]", textColor: "text-black" }
];

const events = [
    { id: "1", image: "/images/event/97_7.jpg", title: "쇼핑위크", date: "2026.03.25 ~ 2026.04.30", badge: "/images/event/badge.jpg", is_active: true },
    { id: "2", image: "/images/event/97_11.jpg", title: "26SS 커리우먼 NEW", date: "2026.04.20 ~ 2026.05.04", badge: "/images/event/badge.jpg", is_active: true },
    { id: "3", image: "/images/event/97_15.jpg", title: "봄맞이 특별할인", date: "2026.02.23 ~ 2026.03.31", badge: "/images/event/badge.jpg", is_active: true },
    { id: "4", image: "/images/event/97_19.jpg", title: "토스페이 프로모션", date: "2025.09.17 ~ 2026.03.17", badge: "/images/event/badge.jpg", is_active: true },
    { id: "5", image: "/images/event/97_23.jpg", title: "시즌오프", date: "2026.02.06 ~ 2026.02.27", badge: "/images/event/badge.jpg", is_active: true },
    { id: "6", image: "/images/event/97_27.jpg", title: "설맞이 쿠폰전", date: "2026.02.09 ~ 2026.02.19", badge: "/images/event/badge.jpg", is_active: true },
    { id: "7", image: "/images/event/97_31.jpg", title: "설준비 쿠폰전", date: "2026.01.26 ~ 2026.02.09", badge: "/images/event/badge.jpg", is_active: true },
    { id: "8", image: "/images/event/97_35.jpg", title: "NEW YEAR 15% 쿠폰", date: "2026.01.02 ~ 2026.01.30", badge: "/images/event/badge.jpg", is_active: true },
    { id: "9", image: "/images/event/97_39.jpg", title: "WINTER", date: "기간 2025.12.01 ~ 2025.12.31", badge: "/images/event/badge.jpg", is_active: false },
    { id: "10", image: "/images/event/97_43.jpg", title: "쿠폰 위크", date: "2025.11.03 ~ 2025.11.14", badge: "/images/event/badge.jpg", is_active: false },
    { id: "11", image: "/images/event/97_47.jpg", title: "추석맞이 쿠폰 FESTA", date: "2025.10.01 ~ 2025.10.13", badge: "/images/event/badge.jpg", is_active: false },
    { id: "12", image: "/images/event/97_51.jpg", title: "9월 슈즈 데이", date: "기간 2025.09.01 ~ 2025.09.30", badge: "/images/event/badge.jpg", is_active: false },
    { id: "13", image: "/images/event/97_55.jpg", title: "S/S 시즌 오프", date: "기간 2025.09.01 ~ 2025.09.30", badge: "/images/event/badge.jpg", is_active: false }
];

export default function EventPage() {
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

            <div className="max-w-[1200px] mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                        이벤트
                    </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-12">
                    {events.map((event, index) => {
                        const CardContent = (
                            <div className="flex flex-col h-full">
                                <div className="relative w-full aspect-[218/259] bg-gray-100 overflow-hidden mb-4">
                                    <Image
                                        src={event.image}
                                        alt={event.title}
                                        fill
                                        unoptimized
                                        className={`object-cover transition-transform duration-500 ${event.is_active ? 'group-hover:scale-105' : ''}`}
                                    />
                                </div>
                                <div className="flex flex-col flex-grow">
                                    <h3 className={`font-semibold text-[17px] leading-tight mb-1 transition-colors line-clamp-2 text-gray-900 ${event.is_active ? 'group-hover:text-black' : ''}`}>
                                        {event.title}
                                    </h3>
                                    <p className="text-[14px] text-[#A3A3A3] mb-3">
                                        {event.date}
                                    </p>
                                    <div className="mt-auto">
                                        {event.is_active ? (
                                            <div className="relative w-[53px] h-[22px]">
                                                <Image
                                                    src={event.badge}
                                                    alt="Badge"
                                                    fill
                                                    unoptimized
                                                    className="object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center justify-center px-2 py-1 bg-gray-300 text-white text-[11px] font-medium leading-none rounded-sm" style={{ height: "22px" }}>
                                                기간만료
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`group ${event.is_active ? 'cursor-pointer' : 'cursor-default'}`}
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
