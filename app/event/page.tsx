"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

type Event = {
    id: string;
    title: string;
    description: string;
    image_url: string;
    created_at: string;
};

const ITEMS_PER_PAGE = 12;

export default function EventPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data, error } = await supabase
                    .from("events")
                    .select("*")
                    .eq("is_active", true)
                    .order("created_at", { ascending: false });

                if (error) {
                    // Silently handle table not found or no permission errors
                    if (error.code !== "PGRST116" && error.code !== "42P01" && !error.message?.includes("406")) {
                        console.error("Error fetching events:", error);
                    }
                    setEvents([]);
                    return;
                }
                setEvents(data || []);
            } catch (error) {
                // Silently fail for events - not critical
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = events.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center py-20 text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-10 text-center">
                <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">News</p>
                <h1 className="text-3xl font-bold tracking-widest" style={{ fontFamily: "'S-Core Dream', sans-serif" }}>소식</h1>
                <p className="mt-4 text-sm text-gray-500">에센시아의 새로운 소식과 이벤트를 확인하세요</p>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">현재 진행 중인 이벤트가 없습니다.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {currentItems.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/event/${event.id}`}>
                                    <div className="group cursor-pointer">
                                        <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-3 border border-gray-100">
                                            {event.image_url ? (
                                                <Image
                                                    src={event.image_url}
                                                    alt={event.title}
                                                    fill
                                                    unoptimized
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Calendar className="w-12 h-12" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-1">
                                            <h3 className="font-medium text-sm text-gray-900 group-hover:text-[#C41E3A] transition-colors line-clamp-2">
                                                {event.title}
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(event.created_at).toLocaleDateString("ko-KR")}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm text-gray-600">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
