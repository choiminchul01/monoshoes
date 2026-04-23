'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ===============================================
// MONO SHOES 프리미엄 랜딩 페이지
// SVG 스트로크 라인 드로잉 - 양쪽 끝에서 만나서 멈춤
// ===============================================

export default function MonoShoesLandingPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 스트로크 1: 시작점(왼쪽)에서 출발
    // 스트로크 2: 끝점(오른쪽)에서 출발
    const stroke1Ref = useRef<SVGTextElement>(null);
    const stroke2Ref = useRef<SVGTextElement>(null);
    const fillRef = useRef<SVGTextElement>(null);

    const textLengthRef = useRef(0);
    const isAnimatingRef = useRef(false);

    // 골드 파티클
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        class Particle {
            x: number; y: number; speedY: number; speedX: number; size: number; alpha: number;
            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.speedY = Math.random() * -0.3 - 0.1;
                this.speedX = Math.random() * 0.2 - 0.1;
                this.size = Math.random() * 2 + 0.5;
                this.alpha = Math.random() * 0.4 + 0.1;
            }
            update(w: number, h: number) {
                this.y += this.speedY; this.x += this.speedX;
                if (this.y < 0) { this.y = h + 10; this.x = Math.random() * w; }
                if (this.x > w) this.x = 0; if (this.x < 0) this.x = w;
            }
            draw(context: CanvasRenderingContext2D) {
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                context.fill();
            }
        }

        const particles: Particle[] = Array.from({ length: 60 }, () => new Particle(canvas.width, canvas.height));
        let animId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(canvas.width, canvas.height); p.draw(ctx); });
            animId = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animId); };
    }, []);

    // 정방향 애니메이션
    const runForwardAnimation = useCallback(async () => {
        const s1 = stroke1Ref.current;
        const s2 = stroke2Ref.current;
        const fill = fillRef.current;
        if (!s1 || !s2 || !fill) return;

        // 텍스트 전체 길이 측정
        const totalLength = s1.getComputedTextLength?.() || 1500;
        textLengthRef.current = totalLength;

        // ======================================
        // 핵심: 각 스트로크가 전체 길이를 담당
        // stroke1: 전체를 그리되, 왼쪽에서 시작
        // stroke2: 전체를 그리되, 오른쪽에서 시작
        // 둘이 겹쳐서 양쪽에서 오는 것처럼 보임
        // ======================================

        // stroke1: dasharray로 전체 길이만큼 그리고 전체 길이만큼 숨김
        // dashoffset을 totalLength에서 0으로 줄이면 왼쪽에서 그려짐
        s1.style.strokeDasharray = `${totalLength}`;
        s1.style.strokeDashoffset = `${totalLength}`;
        s1.style.opacity = '1';

        // stroke2: 같은 방식이지만 음수 offset 사용
        // dashoffset을 -totalLength에서 0으로 올리면 오른쪽에서 그려짐
        s2.style.strokeDasharray = `${totalLength}`;
        s2.style.strokeDashoffset = `${-totalLength}`;
        s2.style.opacity = '1';

        // fill: 완전히 숨김
        fill.style.opacity = '0';

        setIsMounted(true);

        // 1초 대기
        await new Promise(r => setTimeout(r, 1000));

        // ======================================
        // 3초간 양쪽에서 그리기
        // 각 스트로크는 절반 지점(offset = 0)에 도달하면 멈춤
        // ======================================
        const drawStart = performance.now();
        const drawDuration = 3000;

        // 스트로크 완료 상태 추적
        let stroke1Done = false;
        let stroke2Done = false;

        await new Promise<void>((resolve) => {
            const drawTick = (now: number) => {
                const elapsed = now - drawStart;
                const progress = Math.min(elapsed / drawDuration, 1);

                // stroke1: totalLength → 0
                // 중간(0)에 도달하면 멈춤
                if (!stroke1Done) {
                    const newOffset1 = totalLength * (1 - progress);
                    if (newOffset1 <= 0) {
                        s1.style.strokeDashoffset = '0';
                        stroke1Done = true;
                    } else {
                        s1.style.strokeDashoffset = `${newOffset1}`;
                    }
                }

                // stroke2: -totalLength → 0
                // 중간(0)에 도달하면 멈춤
                if (!stroke2Done) {
                    const newOffset2 = -totalLength * (1 - progress);
                    if (newOffset2 >= 0) {
                        s2.style.strokeDashoffset = '0';
                        stroke2Done = true;
                    } else {
                        s2.style.strokeDashoffset = `${newOffset2}`;
                    }
                }

                // 둘 다 완료되지 않았으면 계속
                if (progress < 1) {
                    requestAnimationFrame(drawTick);
                } else {
                    // 최종 확정
                    s1.style.strokeDashoffset = '0';
                    s2.style.strokeDashoffset = '0';
                    resolve();
                }
            };
            requestAnimationFrame(drawTick);
        });

        // ======================================
        // 1초간 채우기
        // ======================================
        const fillStart = performance.now();
        const fillDuration = 1000;

        await new Promise<void>((resolve) => {
            const fillTick = (now: number) => {
                const elapsed = now - fillStart;
                let progress = Math.min(elapsed / fillDuration, 1);
                // easeOutQuad
                progress = 1 - (1 - progress) * (1 - progress);

                fill.style.opacity = `${progress}`;
                // 채우기가 되면서 스트로크는 사라짐
                s1.style.opacity = `${1 - progress}`;
                s2.style.opacity = `${1 - progress}`;

                if (progress < 1) {
                    requestAnimationFrame(fillTick);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(fillTick);
        });

        // 바로 홈으로 이동
        window.location.href = '/home';
    }, []);

    // 페이지 로드 시 시작
    useEffect(() => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;
        requestAnimationFrame(() => runForwardAnimation());
    }, [runForwardAnimation]);

    return (
        <div className="relative min-h-screen overflow-hidden">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
            `}</style>

            {/* 배경 */}
            <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{
                    opacity: 1,
                    background: isTransitioning ? '#ffffff' : 'linear-gradient(to bottom, #1a1a1a, #000000)'
                }}
                transition={{ duration: 1 }}
            />

            {/* 파티클 */}
            <motion.canvas
                ref={canvasRef}
                className="absolute inset-0 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: isTransitioning ? 0 : 0.8 }}
                transition={{ duration: 1 }}
            />

            {/* 메인 */}
            <div className="relative z-20 min-h-screen flex flex-col items-center justify-center">
                <AnimatePresence>
                    {!isTransitioning && (
                        <motion.div
                            className="flex flex-col items-center"
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.8 }}
                        >
                            <svg
                                viewBox="0 0 900 120"
                                className="w-[85vw] max-w-[1100px]"
                                style={{ overflow: 'visible', opacity: isMounted ? 1 : 0 }}
                            >
                                <defs>
                                    <linearGradient id="platinumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#9a9a9a" />
                                        <stop offset="30%" stopColor="#d4d4d4" />
                                        <stop offset="50%" stopColor="#ffffff" />
                                        <stop offset="70%" stopColor="#d4d4d4" />
                                        <stop offset="100%" stopColor="#9a9a9a" />
                                    </linearGradient>
                                </defs>

                                {/* 스트로크 1: 왼쪽에서 출발 */}
                                <text
                                    ref={stroke1Ref}
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: '110px',
                                        fontWeight: 900,
                                        letterSpacing: '0.15em',
                                        fill: 'none',
                                        stroke: 'url(#platinumGradient)',
                                        strokeWidth: 1.5,
                                    }}
                                >
                                    MONO SHOES
                                </text>

                                {/* 스트로크 2: 오른쪽에서 출발 */}
                                <text
                                    ref={stroke2Ref}
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: '110px',
                                        fontWeight: 900,
                                        letterSpacing: '0.15em',
                                        fill: 'none',
                                        stroke: 'url(#platinumGradient)',
                                        strokeWidth: 1.5,
                                    }}
                                >
                                    MONO SHOES
                                </text>

                                {/* 채우기 */}
                                <text
                                    ref={fillRef}
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: '110px',
                                        fontWeight: 900,
                                        letterSpacing: '0.15em',
                                        fill: 'url(#platinumGradient)',
                                        opacity: 0,
                                    }}
                                >
                                    MONO SHOES
                                </text>
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isTransitioning && (
                        <>
                            {/* 배경이 점차 밝아지는 효과 */}
                            <motion.div
                                className="absolute inset-0 z-25"
                                initial={{ backgroundColor: 'rgba(255,255,255,0)' }}
                                animate={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                            />

                            {/* 중앙에서 퍼지는 파문들 */}
                            {[0, 1, 2, 3, 4].map((index) => (
                                <motion.div
                                    key={index}
                                    className="absolute z-30 rounded-full"
                                    style={{
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        border: '2px solid rgba(255,255,255,0.4)',
                                        boxShadow: '0 0 30px rgba(255,255,255,0.3), inset 0 0 30px rgba(255,255,255,0.1)',
                                    }}
                                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                                    animate={{ width: '400vmax', height: '400vmax', opacity: 0 }}
                                    transition={{
                                        duration: 2.5,
                                        delay: index * 0.25,
                                        ease: [0.25, 0.1, 0.25, 1]
                                    }}
                                />
                            ))}

                            {/* 중앙에서 확장되는 화이트 원 */}
                            <motion.div
                                className="absolute z-35 rounded-full bg-white"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    boxShadow: '0 0 100px rgba(255,255,255,0.8)',
                                }}
                                initial={{ width: 0, height: 0 }}
                                animate={{ width: '400vmax', height: '400vmax' }}
                                transition={{
                                    duration: 2,
                                    delay: 0.5,
                                    ease: [0.3, 0, 0.2, 1]
                                }}
                            />
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
