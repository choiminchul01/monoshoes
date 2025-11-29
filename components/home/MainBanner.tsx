"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { fetchBannersAction } from "@/app/admin/settings/actions";

const FALLBACK_SLIDES = [
    {
        id: 1,
        image: "https://placehold.co/1920x800/png?text=ESSENTIA+COLLECTION+1",
        title: "NEW SEASON ARRIVALS",
        subtitle: "Discover the latest luxury trends.",
    },
    {
        id: 2,
        image: "https://placehold.co/1920x800/png?text=ESSENTIA+COLLECTION+2",
        title: "TIMELESS ELEGANCE",
        subtitle: "Classic pieces for your wardrobe.",
    },
    {
        id: 3,
        image: "https://placehold.co/1920x800/png?text=ESSENTIA+COLLECTION+3",
        title: "EXCLUSIVE OFFERS",
        subtitle: "Limited time special prices.",
    },
];

export function MainBanner() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [banners, setBanners] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const result = await fetchBannersAction();

                if (result.success && result.banners) {
                    // Always create 3 slides, using uploaded banner or fallback
                    const combinedBanners = FALLBACK_SLIDES.map((fallback, index) => {
                        const slotKey = index + 1;
                        // result.banners is { 1: url, 2: url, ... }
                        // @ts-ignore - result.banners type is known from action
                        return result.banners[slotKey] || fallback.image;
                    });

                    setBanners(combinedBanners);
                } else {
                    // If fetch fails or no banners, use fallbacks
                    setBanners(FALLBACK_SLIDES.map(s => s.image));
                }
            } catch (error) {
                console.error('Error fetching banners:', error);
                setBanners(FALLBACK_SLIDES.map(s => s.image));
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length === 0) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners]);

    // Construct slides object for rendering
    const slides = banners.length > 0
        ? banners.map((url, idx) => ({
            id: idx + 1,
            image: url,
            title: FALLBACK_SLIDES[idx]?.title || "ESSENTIA COLLECTION",
            subtitle: FALLBACK_SLIDES[idx]?.subtitle || "Luxury Fashion",
        }))
        : FALLBACK_SLIDES;

    if (loading) {
        return (
            <div className="relative w-full h-[60vh] md:h-auto md:aspect-[2.4/1] bg-gray-200 animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-400">Loading banners...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[60vh] md:h-auto md:aspect-[2.4/1] overflow-hidden bg-gray-100">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <Image
                        src={slides[currentSlide].image}
                        alt={slides[currentSlide].title}
                        fill
                        className="object-cover"
                        priority
                    />
                </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? "bg-white w-8" : "bg-white/50"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
