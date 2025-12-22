"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { motion } from "framer-motion";

type Event = {
    id: string;
    title: string;
    description: string;
    image_url: string;
    created_at: string;
};

export default function EventDetailPage() {
    const params = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data, error } = await supabase
                    .from("events")
                    .select("*")
                    .eq("id", params.id)
                    .single();

                if (error) throw error;
                setEvent(data);
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchEvent();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center py-20 text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center py-20">
                    <p className="text-gray-500 mb-4">이벤트를 찾을 수 없습니다.</p>
                    <Link href="/event" className="text-[#C41E3A] hover:underline">
                        목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            {/* Back Button */}
            <Link
                href="/event"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">목록으로</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Event</p>
                    <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "'S-Core Dream', sans-serif" }}>
                        {event.title}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                </div>

                {/* Image */}
                {event.image_url && (
                    <div className="flex justify-center mb-8">
                        <div className="relative w-full max-w-md aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
                            <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                unoptimized
                                className="object-contain"
                            />
                        </div>
                    </div>
                )}

                {/* Description */}
                {event.description && (
                    <div className="prose prose-gray max-w-none">
                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {event.description}
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
