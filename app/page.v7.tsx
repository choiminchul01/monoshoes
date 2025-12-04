"use client";

import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";

const TEXT = "ESSENTIA";
const LETTERS = TEXT.split("");
const TRACKING = "0.5em"; // Common tracking value for perfect alignment

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

    // Spread distance based on layer (Alternating Up/Down)
    const initialY = layer % 2 === 0 ? 150 * layer : -150 * layer;

    return (
        <motion.h1
            style={{
                x: isRevealed ? moveX : 0,
                y: isRevealed ? moveY : 0,
            }}
            initial={{
                y: initialY,
                opacity: 0,
                filter: "blur(10px)"
            }}
            animate={{
                y: 0, // Converge to center
                opacity: [0, 1, 0], // Fade in, stay fully visible, then fade out at end
                filter: ["blur(10px)", "blur(0px)", "blur(0px)"],
            }}
            transition={{
                duration: 3.0,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.2, 1]
            }}
            className="absolute text-6xl md:text-8xl font-bold text-transparent select-none pointer-events-none"
        >
            <span
                style={{
                    WebkitTextStroke: "1px rgba(255, 255, 255, 0.8)", // Much clearer line
                    letterSpacing: TRACKING,
                    marginRight: `-${TRACKING}` // Compensate for last letter spacing to ensure perfect centering
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
        // Enable interaction after animation
        setTimeout(() => setIsRevealed(true), 3000);
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
                    style={{ gap: TRACKING }} // Use gap to match letter-spacing
                    initial="hidden"
                    animate="visible"
                >
                    {LETTERS.map((letter, i) => (
                        <motion.span
                            key={i}
                            custom={i}
                            variants={{
                                hidden: { opacity: 0, filter: "blur(10px)", scale: 1.1 },
                                visible: {
                                    opacity: 1,
                                    filter: "blur(0px)",
                                    scale: 1,
                                    transition: {
                                        delay: 1.5 + (Math.random() * 1.0), // Start appearing as lines converge
                                        duration: 1.5,
                                        ease: "easeOut"
                                    }
                                }
                            }}
                            className="text-6xl md:text-8xl font-bold text-white select-none"
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
                transition={{ duration: 1, delay: 3.0 }}
                className="absolute bottom-12 text-center z-20"
            >
                <p className="text-[10px] md:text-xs text-gray-500 tracking-[0.8em] uppercase font-medium">
                    Converging Essence
                </p>
                <div className="mt-4 w-px h-8 bg-gradient-to-b from-gray-500 to-transparent mx-auto"></div>
            </motion.div>
        </div>
    );
}
