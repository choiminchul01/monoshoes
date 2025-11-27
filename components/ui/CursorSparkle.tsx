"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
    createdAt: number;
}

const COLORS = ["#FFD700", "#FFFFFF", "#F0E68C", "#E6E6FA"]; // Gold, White, Khaki, Lavender

export function CursorSparkle() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const newParticle: Particle = {
                id: crypto.randomUUID(),
                x: e.clientX,
                y: e.clientY,
                size: Math.random() * 4 + 2,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                createdAt: Date.now(),
            };
            setParticles((prevParticles) => [...prevParticles.slice(-20), newParticle]);
        };

        const handleClick = (e: MouseEvent) => {
            const burstCount = 12;
            const newParticles: Particle[] = [];

            for (let i = 0; i < burstCount; i++) {
                newParticles.push({
                    id: crypto.randomUUID(),
                    x: e.clientX,
                    y: e.clientY,
                    size: Math.random() * 6 + 4,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    createdAt: Date.now(),
                });
            }

            setParticles((prevParticles) => [...prevParticles.slice(-50), ...newParticles]);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("click", handleClick);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("click", handleClick);
        };
    }, []);

    // Cleanup old particles
    useEffect(() => {
        const interval = setInterval(() => {
            setParticles((prev) => prev.filter((p) => p.createdAt > Date.now() - 1000));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            <AnimatePresence>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{ opacity: 1, scale: 1, x: particle.x, y: particle.y }}
                        animate={{
                            opacity: 0,
                            scale: 0,
                            x: particle.x + (Math.random() - 0.5) * 100, // Wider spread for burst
                            y: particle.y + (Math.random() - 0.5) * 100, // Wider spread for burst
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            width: particle.size,
                            height: particle.size,
                            borderRadius: "50%",
                            backgroundColor: particle.color,
                            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
