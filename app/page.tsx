"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export default function LandingPage() {
    const router = useRouter();

    const handleEnter = () => {
        router.push("/home");
    };

    return (
        <div
            className="relative min-h-screen bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            onClick={handleEnter}
        >
            {/* Animated Logo */}
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 1.5,
                    ease: "easeOut"
                }}
                className="text-center"
            >
                <motion.h1
                    className="text-6xl md:text-8xl font-bold tracking-[0.2em] mb-4"
                    animate={{
                        y: [0, -10, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    ESSENTIA
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="text-sm md:text-base text-gray-500 tracking-widest uppercase"
                >
                    Luxury. Elegance. Timeless.
                </motion.p>
            </motion.div>

            {/* Click Here Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-12 flex flex-col items-center gap-2"
            >
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
            </motion.div>

            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-900 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gray-900 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
}
