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
                    .select("id, title, image_url")
                    .eq("is_popup", true)
                    .eq("is_active", true)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (error) {
                    // No popup event found is not an error
                    if (error.code !== "PGRST116") {
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
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
                    onClick={closePopup}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closePopup}
                            className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Image */}
                        <Link href={`/event/${popupEvent.id}`} onClick={closePopup}>
                            <div className="relative aspect-[3/4] bg-gray-100">
                                {popupEvent.image_url ? (
                                    <Image
                                        src={popupEvent.image_url}
                                        alt={popupEvent.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-gray-400 text-sm">{popupEvent.title}</p>
                                    </div>
                                )}
                            </div>
                        </Link>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 flex items-center justify-between">
                            <button
                                onClick={hideForToday}
                                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                오늘 하루 보지 않기
                            </button>
                            <button
                                onClick={closePopup}
                                className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
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
