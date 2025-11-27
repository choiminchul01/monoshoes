"use client";

import { motion } from "framer-motion";

const SLOGANS = [
    "ESSENTIA",
    "LUXURY",
    "COLLECTION",
    "TIMELESS",
    "ELEGANCE",
    "ESSENTIA",
    "LUXURY",
    "COLLECTION",
    "TIMELESS",
    "ELEGANCE",
];

export function HomeSidebar() {
    return (
        <aside className="w-full md:w-36 flex-shrink-0 hidden md:block overflow-hidden h-[calc(100vh-8rem)] sticky top-24 border-r border-gray-100 bg-black">
            <div className="h-full flex justify-center items-center relative w-full">
                <motion.div
                    className="flex flex-col items-center gap-12 absolute"
                    animate={{
                        y: [0, -1000], // Move up (from 0 to -1000)
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 25,
                        ease: "linear",
                    }}
                >
                    {/* Repeat the list multiple times to ensure seamless looping */}
                    {[...SLOGANS, ...SLOGANS, ...SLOGANS, ...SLOGANS].map((text, index) => (
                        <span
                            key={index}
                            className="text-5xl font-black tracking-widest text-white select-none uppercase"
                            style={{
                                writingMode: "vertical-rl",
                                textOrientation: "upright",
                                letterSpacing: "0.2em"
                            }}
                        >
                            {text}
                        </span>
                    ))}
                </motion.div>
            </div>
        </aside>
    );
}
