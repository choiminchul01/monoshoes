"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Event = {
    id: string;
    title: string;
    description: string;
    image_url: string;
    start_date: string;
    is_active: boolean;
    is_popup: boolean;
};

export default function EventSlider() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            const { data } = await supabase
                .from('events')
                .select('id, title, description, image_url, start_date, is_active, is_popup')
                .eq('is_active', true)
                .order('start_date', { ascending: false });

            if (data && data.length > 0) {
                setEvents(data);
            }
        };
        fetchEvents();
    }, []);

    if (events.length === 0) return null;

    // 무한 스크롤을 위해 배열 복제 (최소 4세트)
    const repeatCount = Math.max(4, Math.ceil(20 / events.length));
    const duplicatedEvents = Array.from({ length: repeatCount }, () => events).flat();

    return (
        <section className="py-24 bg-[#FAFAFA]">
            <div className="max-w-[1800px] mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                    <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">EXCLUSIVE</p>
                    <div className="inline-block">
                        <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                            EVENT
                        </h2>
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
                            animation: `eventScroll ${events.length * 16}s linear infinite`,
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                    >
                        {duplicatedEvents.map((event, index) => {
                            const CardContent = (
                                <div className="flex flex-col h-full w-[240px] md:w-[280px] group/card">
                                    <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden mb-6 rounded-xl shadow-sm">
                                        {event.image_url ? (
                                            <Image
                                                src={event.image_url}
                                                alt={event.title}
                                                fill
                                                unoptimized
                                                className={`object-cover transition-transform duration-1000 ease-out ${event.is_active ? 'group-hover/card:scale-110' : ''}`}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-gray-300 text-4xl">📅</span>
                                            </div>
                                        )}
                                        {/* Text Overlay */}
                                        <div className={`absolute inset-0 flex flex-col justify-start p-6 transition-all duration-500 ${event.is_active ? 'bg-gradient-to-b from-black/90 via-black/20 to-transparent' : 'bg-black/60 grayscale'}`}>
                                            <div className="flex flex-col items-start text-left">
                                                <p className="text-white/70 text-[9px] tracking-[0.3em] mb-1.5 uppercase font-bold">
                                                    EVENT
                                                </p>
                                                <h4 className="text-white text-lg font-black tracking-tight mb-2 leading-tight">
                                                    {event.title}
                                                </h4>
                                                {event.description && (
                                                    <>
                                                        <div className="h-[1.5px] w-6 bg-white/50 mb-3" />
                                                        <p className="text-white/90 text-[13px] font-bold tracking-wide">
                                                            {event.description}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Popup badge */}
                                        {event.is_popup && (
                                            <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-[9px] font-bold rounded-full tracking-wider">
                                                POPUP
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col px-2">
                                        <p className="text-[11px] text-gray-400 font-bold tracking-widest mb-1">
                                            {event.start_date ? new Date(event.start_date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''}
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
                                        <div>{CardContent}</div>
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
                        100% { transform: translateX(-${Math.floor(100 / repeatCount)}%); }
                    }
                `
            }} />
        </section>
    );
}
