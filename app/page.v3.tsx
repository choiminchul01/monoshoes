"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";

export default function LandingPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Mouse position state
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics for rotation
    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        // Calculate normalized position (-0.5 to 0.5)
        const xPct = clientX / innerWidth - 0.5;
        const yPct = clientY / innerHeight - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleEnter = () => {
        router.push("/home");
    };

    // Transform values for 3D effect
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [20, -20]); // Tilt up/down
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-20, 20]); // Tilt left/right
    const shadowX = useTransform(mouseX, [-0.5, 0.5], [20, -20]); // Shadow moves opposite
    const shadowY = useTransform(mouseY, [-0.5, 0.5], [20, -20]);

    if (!mounted) return null;

    return (
        <div
            className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden perspective-1000 cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleEnter}
            style={{ perspective: "1000px" }}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay"></div>

            {/* 3D Container */}
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="relative z-10"
            >
                {/* Shadow Layer (Depth) */}
                <motion.h1
                    style={{
                        x: shadowX,
                        y: shadowY,
                        z: -50, // Push back
                        opacity: 0.3,
                    }}
                    className="absolute inset-0 text-6xl md:text-9xl font-black text-gray-800 tracking-tighter select-none blur-sm"
                >
                    ESSENTIA
                </motion.h1>

                {/* Main Text Layer */}
                <motion.h1
                    style={{
                        z: 50, // Pull forward
                    }}
                    className="text-6xl md:text-9xl font-black text-white tracking-tighter select-none relative"
                >
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500">
                        ESSENTIA
                    </span>
                </motion.h1>
            </motion.div>

            {/* Subtext */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="absolute bottom-12 text-center"
            >
                <p className="text-xs md:text-sm text-gray-500 tracking-[0.5em] uppercase font-medium">
                    Experience Dimension
                </p>
                <p className="text-[10px] text-gray-600 mt-2 tracking-widest">
                    Click to Enter
                </p>
            </motion.div>

            {/* Floating Particles (Optional) */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full blur-[1px]"
                />
                <motion.div
                    animate={{ y: [0, 30, 0], opacity: [0.1, 0.4, 0.1] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-gray-500 rounded-full blur-[2px]"
                />
            </div>
        </div>
    );
}
