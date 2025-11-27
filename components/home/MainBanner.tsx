"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const SLIDES = [
    {
        id: 1,
        image: "https://placehold.co/1920x1080/png?text=ESSENTIA+COLLECTION+1",
        title: "NEW SEASON ARRIVALS",
        subtitle: "Discover the latest luxury trends.",
    },
    {
        id: 2,
        image: "https://placehold.co/1920x1080/png?text=ESSENTIA+COLLECTION+2",
        title: "TIMELESS ELEGANCE",
        subtitle: "Classic pieces for your wardrobe.",
    },
    {
        id: 3,
        image: "https://placehold.co/1920x1080/png?text=ESSENTIA+COLLECTION+3",
        title: "EXCLUSIVE OFFERS",
        subtitle: "Limited time special prices.",
    },
];

export function MainBanner() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-gray-100">
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
                        src={SLIDES[currentSlide].image}
                        alt={SLIDES[currentSlide].title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center p-4">
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-4xl md:text-6xl font-bold tracking-widest mb-4"
                        >
                            {SLIDES[currentSlide].title}
                        </motion.h2>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-lg md:text-2xl font-light tracking-wider"
                        >
                            {SLIDES[currentSlide].subtitle}
                        </motion.p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                {SLIDES.map((_, index) => (
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
