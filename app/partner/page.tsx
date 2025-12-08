"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const ESSENTIA = "ESSENTIA".split("");
const PARTNER = "PARTNER".split("");

export default function PartnerPage() {
    const router = useRouter();
    const [essentiaDelays, setEssentiaDelays] = useState<number[]>([]);
    const [partnerDelays, setPartnerDelays] = useState<number[]>([]);
    const [isLanded, setIsLanded] = useState(false);
    const [essentiaLastIdx, setEssentiaLastIdx] = useState<number>(-1);
    const [partnerLastIdx, setPartnerLastIdx] = useState<number>(-1);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const essentiaRandomDelays = ESSENTIA.map(() => Math.random() * 1.2);
        const partnerRandomDelays = PARTNER.map(() => Math.random() * 1.2 + 0.8);

        setEssentiaDelays(essentiaRandomDelays);
        setPartnerDelays(partnerRandomDelays);

        const essentiaMaxIdx = essentiaRandomDelays.indexOf(Math.max(...essentiaRandomDelays));
        const partnerMaxIdx = partnerRandomDelays.indexOf(Math.max(...partnerRandomDelays));
        setEssentiaLastIdx(essentiaMaxIdx);
        setPartnerLastIdx(partnerMaxIdx);

        const maxDelay = Math.max(...essentiaRandomDelays, ...partnerRandomDelays);
        const totalDuration = (maxDelay + 2.0) * 1000;

        const timer = setTimeout(() => {
            setIsLanded(true);
        }, totalDuration - 500);

        return () => clearTimeout(timer);
    }, []);

    const handleEnter = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setTimeout(() => {
            router.push("/home");
        }, 800);
    };

    const letterAnimation = (delay: number, isGold: boolean = false) => ({
        initial: { y: -1000, opacity: 0 },
        animate: {
            y: 0,
            opacity: 1,
            color: isLanded && isGold ? "#D4AF37" : "#000000"
        },
        transition: {
            y: { duration: 2.0, delay: delay, ease: [0.16, 1, 0.3, 1] as const },
            opacity: { duration: 1.5, delay: delay, ease: "easeOut" as const },
            color: { duration: 1.5, ease: "easeInOut" as const }
        }
    });

    return (
        <div
            className="relative min-h-screen bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            onClick={handleEnter}
        >
            {/* 전환 효과 오버레이 - 1번: Fade Out + Zoom In */}
            <motion.div
                className="fixed inset-0 bg-black z-50 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: isTransitioning ? 1 : 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />

            {/* Zoom In 효과 컨테이너 */}
            <motion.div
                className="flex flex-col items-center"
                animate={{
                    scale: isTransitioning ? 1.5 : 1,
                    opacity: isTransitioning ? 0 : 1
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            >
                {/* Animated Logo - Two Lines */}
                <div className="text-center relative z-10 flex flex-col items-center gap-3 md:gap-6 px-6 md:px-0">
                    {/* ESSENTIA */}
                    <div className="flex gap-0.5 md:gap-1">
                        {essentiaDelays.length > 0 && ESSENTIA.map((letter, i) => (
                            <motion.div
                                key={`essentia-${i}`}
                                {...letterAnimation(essentiaDelays[i], i === essentiaLastIdx)}
                                className="text-3xl md:text-5xl font-bold tracking-[0.2em] text-gray-700"
                                style={{ fontFamily: 'var(--font-cinzel), serif' }}
                            >
                                <motion.span
                                    animate={isLanded ? { y: [0, -8, 0] } : {}}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="inline-block"
                                >
                                    {letter}
                                </motion.span>
                            </motion.div>
                        ))}
                    </div>

                    {/* PARTNER */}
                    <div className="flex gap-0.5 md:gap-2">
                        {partnerDelays.length > 0 && PARTNER.map((letter, i) => (
                            <motion.div
                                key={`partner-${i}`}
                                {...letterAnimation(partnerDelays[i], i === partnerLastIdx)}
                                className="text-5xl md:text-[5.5rem] font-bold tracking-wider"
                                style={{ fontFamily: 'var(--font-cinzel), serif' }}
                            >
                                <motion.span
                                    animate={isLanded ? { y: [0, -15, 0] } : {}}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="inline-block"
                                >
                                    {letter}
                                </motion.span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLanded ? 1 : 0 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="text-center mt-6"
                >
                    <p className="text-xs md:text-sm text-gray-500 tracking-[0.2em] uppercase mb-10">
                        Collaboration. Growth. Together.
                    </p>

                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs tracking-widest uppercase text-gray-400">Click to Enter</p>
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ChevronDown className="w-6 h-6 text-gray-400" />
                        </motion.div>
                    </div>
                </motion.div>

                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-900 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gray-900 rounded-full blur-3xl"></div>
                </div>
            </motion.div>
        </div>
    );
}
