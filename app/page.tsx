"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const TEXT = "ESSENTIA";
const LETTERS = TEXT.split("");

export default function LandingPage() {
    const router = useRouter();
    const [delays, setDelays] = useState<number[]>([]);
    const [lastLetterIdx, setLastLetterIdx] = useState<number>(-1);
    const [isLanded, setIsLanded] = useState(false);

    useEffect(() => {
        // Generate random delays for "rain" effect
        // We want a nice spread, e.g., between 0 and 1.5 seconds
        const randomDelays = LETTERS.map(() => Math.random() * 1.5);
        setDelays(randomDelays);

        // Find which letter will land last (max delay)
        const maxDelay = Math.max(...randomDelays);
        const maxIdx = randomDelays.indexOf(maxDelay);
        setLastLetterIdx(maxIdx);

        // Set landed state after the last letter finishes (max delay + drop duration)
        // Drop duration is set to 2.0s in the animation below
        const totalDuration = (maxDelay + 2.0) * 1000;
        const timer = setTimeout(() => {
            setIsLanded(true);
        }, totalDuration - 500); // Slightly before to start color transition smoothly

        return () => clearTimeout(timer);
    }, []);

    const handleEnter = () => {
        router.push("/home");
    };

    return (
        <div
            className="relative min-h-screen bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            onClick={handleEnter}
        >
            {/* Animated Logo */}
            <div className="text-center relative z-10 flex gap-0.5 md:gap-2 px-6 md:px-0">
                {delays.length > 0 && LETTERS.map((letter, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -1000, opacity: 0 }}
                        animate={{
                            y: 0,
                            opacity: 1,
                            color: isLanded && i === lastLetterIdx ? "#D4AF37" : "#000000" // Gold if last letter & landed
                        }}
                        transition={{
                            y: {
                                duration: 2.0, // Slower, more weight
                                delay: delays[i],
                                ease: [0.16, 1, 0.3, 1] // easeOutExpo: Fast start, very slow luxurious settle
                            },
                            opacity: { duration: 1.5, delay: delays[i], ease: "easeOut" }, // Fade in slower
                            color: { duration: 1.5, ease: "easeInOut" } // Smooth color transition
                        }}
                        className="text-5xl md:text-8xl font-bold tracking-wider"
                        style={{ fontFamily: 'var(--font-cinzel), serif' }}
                    >
                        <motion.span
                            animate={isLanded ? {
                                y: [0, -15, 0],
                            } : {}}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                // delay: i * 0.1 // Removed stagger for synchronous luxury feel
                            }}
                            className="inline-block"
                        >
                            {letter}
                        </motion.span>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isLanded ? 1 : 0 }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="text-center mt-8"
            >
                <p className="text-sm md:text-base text-gray-500 tracking-[0.2em] uppercase mb-12">
                    Luxury. Elegance. Timeless.
                </p>

                {/* Click Here Indicator */}
                <div className="flex flex-col items-center gap-2">
                    <p className="text-xs tracking-widest uppercase text-gray-400">Click to Enter</p>
                    <motion.div
                        animate={{
                            y: [0, 10, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-900 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gray-900 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
}
