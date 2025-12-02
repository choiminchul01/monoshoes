"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function TopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);

        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={scrollToTop}
                    className="fixed bottom-28 right-8 z-50 flex flex-col items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg hover:bg-black hover:text-white transition-colors duration-300 cursor-pointer border border-black group"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="w-6 h-6 mb-1" />
                    <span className="text-[0.6rem] font-bold tracking-widest">TOP</span>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
