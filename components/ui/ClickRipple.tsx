"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ripple {
    id: number;
    x: number;
    y: number;
}

export function ClickRipple() {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newRipple: Ripple = {
                id: Date.now(),
                x: e.clientX,
                y: e.clientY,
            };

            setRipples((prev) => [...prev, newRipple]);

            // Remove ripple after animation
            setTimeout(() => {
                setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
            }, 800);
        };

        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <AnimatePresence>
                {ripples.map((ripple) => (
                    <motion.div
                        key={ripple.id}
                        initial={{
                            scale: 0,
                            opacity: 0.5,
                            x: ripple.x - 20,
                            y: ripple.y - 20,
                        }}
                        animate={{
                            scale: 2.5,
                            opacity: 0,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                        }}
                        className="absolute w-10 h-10 rounded-full border-2 border-[#D4AF37]"
                        style={{
                            boxShadow: "0 0 15px rgba(212, 175, 55, 0.3)",
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
