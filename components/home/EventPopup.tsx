"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

type PopupEvent = {
    id: string;
    title: string;
    description: string;
    image_url: string;
};

const POPUP_HIDE_KEY = "essentia_popup_hide_until";

export default function EventPopup() {
    const [popupEvent, setPopupEvent] = useState<PopupEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if popup should be hidden (user clicked "Don't show today")
        const hideUntil = localStorage.getItem(POPUP_HIDE_KEY);
        if (hideUntil) {
            const hideUntilDate = new Date(hideUntil);
            if (new Date() < hideUntilDate) {
                return; // Don't show popup
            }
        }

        // Fetch popup event
        const fetchPopupEvent = async () => {
            try {
                const { data, error } = await supabase
                    .from("events")
                    .select("id, title, description, image_url")
                    .eq("is_popup", true)
                    .eq("is_active", true)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (error) {
                    // No popup event found or table doesn't exist is not an error
                    if (error.code !== "PGRST116" && error.code !== "406") {
                        console.error("Error fetching popup event:", error);
                    }
                    return;
                }

                if (data) {
                    setPopupEvent(data);
                    setIsVisible(true);
                }
            } catch (error) {
                console.error("Error fetching popup event:", error);
            }
        };

        fetchPopupEvent();
    }, []);

    const closePopup = () => {
        setIsVisible(false);
    };

    const hideForToday = () => {
        // Set hide until end of today
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        localStorage.setItem(POPUP_HIDE_KEY, tomorrow.toISOString());
        setIsVisible(false);
    };

    if (!popupEvent || !isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm"
                    onClick={closePopup}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                        className="relative bg-white rounded-3xl overflow-hidden max-w-[400px] w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closePopup}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all backdrop-blur-md"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Image & Text Overlay */}
                        <Link href={`/event/${popupEvent.id}`} onClick={closePopup} className="block group">
                            <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                                {popupEvent.image_url ? (
                                    <>
                                        <Image
                                            src={popupEvent.image_url}
                                            alt={popupEvent.title}
                                            fill
                                            unoptimized
                                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        {/* Premium Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                                            <p className="text-white/70 text-[10px] tracking-[0.3em] mb-2 uppercase font-black">SPECIAL EVENT</p>
                                            <h3 className="text-white text-3xl font-black tracking-tight mb-3 leading-tight">
                                                {popupEvent.title}
                                            </h3>
                                            {popupEvent.description && (
                                                <>
                                                    <div className="h-[2px] w-8 bg-white/60 mb-4" />
                                                    <p className="text-white/90 text-base font-bold tracking-wide">
                                                        {popupEvent.description}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-center">
                                        <p className="text-gray-400">{popupEvent.title}</p>
                                    </div>
                                )}
                            </div>
                        </Link>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-white flex items-center justify-between border-t border-gray-100">
                            <button
                                onClick={hideForToday}
                                className="text-xs font-bold text-gray-400 hover:text-black transition-colors tracking-tighter"
                            >
                                오늘 하루 보지 않기
                            </button>
                            <button
                                onClick={closePopup}
                                className="text-sm font-black text-gray-900 hover:underline transition-all"
                            >
                                닫기
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
