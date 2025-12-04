"use client";

import { motion, useMotionValue, useSpring, useTransform, MotionValue, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";

const TEXT = "ESSENTIA";
const LETTERS = TEXT.split("");

// Echo Layer Component
const EchoLayer = ({
    mouseX,
    mouseY,
    layer,
    isRevealed
}: {
    mouseX: MotionValue<number>,
    mouseY: MotionValue<number>,
    layer: number,
    isRevealed: boolean
}) => {
    // Parallax effect (active only after reveal)
    const moveX = useTransform(mouseX, [-1, 1], [-20 * layer, 20 * layer]);
    const moveY = useTransform(mouseY, [-1, 1], [-10 * layer, 10 * layer]);

    // Opacity fades out for further layers
    const opacity = 0.3 - (layer * 0.05);

    return (
        <motion.h1
            style={{
                x: isRevealed ? moveX : 0,
                y: isRevealed ? moveY : 0,
                opacity
            }}
            // Explosion Animation triggered when isRevealed becomes true
            animate={isRevealed ? {
                y: [0, layer % 2 === 0 ? 120 * layer : -120 * layer, 0], // Increased spread slightly for larger text
                scale: [1, 1.05, 1],
                filter: ["blur(0px)", "blur(4px)", "blur(0px)"],
            } : {}}
            transition={{
                duration: 2.5,
                ease: [0.16, 1, 0.3, 1], // Luxurious ease
                times: [0, 0.5, 1]
            }}
            // Increased font size by ~30% relative to main text (5xl/7xl -> 7xl/9xl)
            className="absolute text-7xl md:text-9xl font-bold text-transparent select-none pointer-events-none"
        >
            <span
                style={{
                    WebkitTextStroke: "1px rgba(255, 255, 255, 0.2)",
                    letterSpacing: "1.3em" // Matching wider tracking
                }}
            >
                {TEXT}
            </span>
        </motion.h1>
    );
};

export default function LandingPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    // Mouse position state
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth physics
    const springConfig = { stiffness: 50, damping: 20 };
    const mouseX = useSpring(x, springConfig);
    const mouseY = useSpring(y, springConfig);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseMove = (e: MouseEvent) => {
        if (!isRevealed) return; // Disable interaction during intro

        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        const xPct = (clientX / innerWidth - 0.5) * 2;
        const yPct = (clientY / innerHeight - 0.5) * 2;

        x.set(xPct);
        y.set(yPct);
    };

    const handleEnter = () => {
        router.push("/home");
    };

    if (!mounted) return null;

    return (
        <div
            className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={handleEnter}
        >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 flex items-center justify-center w-full h-full perspective-1000">

                {/* Echo Layers (Back) */}
                {[1, 2, 3, 4].map((layer) => (
                    <EchoLayer
                        key={layer}
                        mouseX={mouseX}
                        mouseY={mouseY}
                        layer={layer}
                        isRevealed={isRevealed}
                    />
                ))}

                {/* Main Text Layer (Front) */}
                <motion.div
                    className="relative z-20 flex"
                    initial="hidden"
                    animate="visible"
                    onAnimationComplete={() => setIsRevealed(true)}
                >
                    {LETTERS.map((letter, i) => (
                        <motion.span
                            key={i}
                            custom={i}
                            variants={{
                                hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
                                visible: {
                                    opacity: 1,
                                    filter: "blur(0px)",
                                    y: 0,
                                    transition: {
                                        delay: Math.random() * 1.5, // Random delay
                                        duration: 1.5,
                                        ease: "easeOut"
                                    }
                                }
                            }}
                            className="text-5xl md:text-7xl font-bold text-white select-none"
                            style={{
                                letterSpacing: "1.3em", // Increased tracking by 30% (1em -> 1.3em)
                                marginRight: "-1.3em" // Compensate for last letter spacing
                            }}
                        >
                            {letter}
                        </motion.span>
                    ))}
                </motion.div>
            </div>

            {/* Subtext */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isRevealed ? 1 : 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute bottom-12 text-center z-20"
            >
                <p className="text-[10px] md:text-xs text-gray-500 tracking-[0.8em] uppercase font-medium">
                    Kinetic Reveal
                </p>
                <div className="mt-4 w-px h-8 bg-gradient-to-b from-gray-500 to-transparent mx-auto"></div>
            </motion.div>
        </div>
    );
}
