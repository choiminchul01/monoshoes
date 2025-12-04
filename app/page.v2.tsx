"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

export default function LandingPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Mouse position for spotlight effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        mouseX.set(clientX);
        mouseY.set(clientY);
    };

    const handleEnter = () => {
        router.push("/home");
    };

    // Spotlight gradient
    const background = useMotionTemplate`radial-gradient(
        600px circle at ${mouseX}px ${mouseY}px,
        rgba(255, 255, 255, 0.03),
        transparent 80%
    )`;

    if (!mounted) return null;

    return (
        <div
            className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden cursor-none selection:bg-white selection:text-black"
            onMouseMove={handleMouseMove}
            onClick={handleEnter}
        >
            {/* Spotlight Background */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background }}
            />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center text-center px-4">

                {/* Main Title - Blur Reveal */}
                <motion.div
                    initial={{ filter: "blur(20px)", opacity: 0, scale: 0.9 }}
                    animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} // Slow, luxurious ease
                    className="mb-8"
                >
                    <h1 className="text-6xl md:text-9xl font-bold text-white tracking-[0.2em] md:tracking-[0.3em] font-serif">
                        ESSENTIA
                    </h1>
                </motion.div>

                {/* Subtitle - Slow Fade */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                    className="mb-16"
                >
                    <p className="text-gray-400 text-sm md:text-base tracking-[0.5em] uppercase font-light">
                        Redefining Modern Luxury
                    </p>
                </motion.div>

                {/* Enter Button - Magnetic & Glow */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.5 }}
                    whileHover={{ scale: 1.05, textShadow: "0 0 8px rgb(255,255,255)" }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-8 py-3 overflow-hidden rounded-full bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/30"
                >
                    <span className="relative z-10 flex items-center gap-2 text-white text-xs md:text-sm tracking-[0.2em] uppercase font-medium">
                        Enter Experience
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>

                    {/* Button Glow Effect */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
                </motion.button>
            </div>

            {/* Custom Cursor Follower (Optional - simple dot) */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 border border-white/20 rounded-full pointer-events-none mix-blend-difference z-50 hidden md:block"
                style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
            />
            <motion.div
                className="fixed top-0 left-0 w-1 h-1 bg-white rounded-full pointer-events-none mix-blend-difference z-50 hidden md:block"
                style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
            />

            {/* Bottom Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 1, delay: 2 }}
                className="absolute bottom-8 text-[10px] text-white tracking-widest uppercase"
            >
                Est. 2024
            </motion.div>
        </div>
    );
}
