"use client";

import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";

// Separate component to handle hooks correctly
const EchoLayer = ({ mouseX, mouseY, layer }: { mouseX: MotionValue<number>, mouseY: MotionValue<number>, layer: number }) => {
    // Calculate parallax offset for each layer
    // Further layers move MORE to create depth
    const moveX = useTransform(mouseX, [-1, 1], [-50 * layer, 50 * layer]);
    const moveY = useTransform(mouseY, [-1, 1], [-20 * layer, 20 * layer]);
    const opacity = 0.6 - (layer * 0.15); // Fade out further layers

    return (
        <motion.h1
            style={{ x: moveX, y: moveY, opacity }}
            className="absolute text-6xl md:text-9xl font-black text-transparent tracking-tighter select-none pointer-events-none"
        >
            <span
                style={{
                    WebkitTextStroke: "1px rgba(255, 255, 255, 0.5)",
                }}
            >
                ESSENTIA
            </span>
        </motion.h1>
    );
};

export default function LandingPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Mouse position state
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth physics
    const springConfig = { stiffness: 100, damping: 30 };
    const mouseX = useSpring(x, springConfig);
    const mouseY = useSpring(y, springConfig);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        const xPct = (clientX / innerWidth - 0.5) * 2; // -1 to 1
        const yPct = (clientY / innerHeight - 0.5) * 2; // -1 to 1

        x.set(xPct);
        y.set(yPct);
    };

    const handleEnter = () => {
        router.push("/home");
    };

    // Generate layers
    const layers = [1, 2, 3, 4]; // Depth layers

    if (!mounted) return null;

    return (
        <div
            className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleEnter}
        >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 flex items-center justify-center w-full h-full">

                {/* Echo Layers (Back) */}
                {layers.map((layer) => (
                    <EchoLayer key={layer} mouseX={mouseX} mouseY={mouseY} layer={layer} />
                ))}

                {/* Main Layer (Front) */}
                <motion.h1
                    className="relative z-20 text-6xl md:text-9xl font-black text-white tracking-tighter select-none"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                >
                    ESSENTIA
                </motion.h1>
            </div>

            {/* Subtext */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-12 text-center z-20"
            >
                <p className="text-xs md:text-sm text-gray-500 tracking-[0.5em] uppercase font-medium">
                    Dimensional Luxury
                </p>
                <div className="mt-4 w-px h-12 bg-gradient-to-b from-gray-500 to-transparent mx-auto"></div>
            </motion.div>
        </div>
    );
}
