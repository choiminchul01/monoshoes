"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

type AdminModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
    showParticles?: boolean;
};

// Gold particle animation for ESSENTIA branding
function useParticleAnimation(canvasRef: React.RefObject<HTMLCanvasElement>, isOpen: boolean) {
    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();

        class Particle {
            x: number;
            y: number;
            speedY: number;
            speedX: number;
            size: number;
            alpha: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.speedY = Math.random() * -0.5 - 0.2;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.size = Math.random() * 2 + 1;
                this.alpha = Math.random() * 0.3 + 0.1;
            }

            update(w: number, h: number) {
                this.y += this.speedY;
                this.x += this.speedX;
                if (this.y < 0) {
                    this.y = h + 10;
                    this.x = Math.random() * w;
                }
                if (this.x > w) this.x = 0;
                if (this.x < 0) this.x = w;
            }

            draw(context: CanvasRenderingContext2D) {
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fillStyle = `rgba(212, 175, 55, ${this.alpha})`;
                context.fill();
            }
        }

        const particles: Particle[] = [];
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(canvas.width, canvas.height));
        }

        window.addEventListener('resize', resizeCanvas);

        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((particle) => {
                particle.update(canvas.width, canvas.height);
                particle.draw(ctx);
            });
            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, [isOpen, canvasRef]);
}

export default function AdminModal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-md",
    showParticles = true,
}: AdminModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useParticleAnimation(canvasRef, isOpen && showParticles);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#001E10] to-[#000000]" />

            {/* Particle Canvas */}
            {showParticles && (
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                />
            )}

            {/* Brand Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <h1
                    className="text-[15vw] font-bold text-[#D4AF37] opacity-15 select-none whitespace-nowrap tracking-widest"
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                    ESSENTIA
                </h1>
            </div>

            {/* Close Button (Outside) */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20"
            >
                <X className="w-8 h-8" />
            </button>

            {/* Modal Content */}
            <div
                className={`relative z-10 ${maxWidth} w-full mx-4 bg-[#FDFCF5] rounded-lg shadow-xl border border-[#D4AF37]/30 max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-[#FDFCF5] border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

// Export a simpler version for quick use
export function AdminModalBackdrop({ children }: { children: ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-[#001E10] to-[#000000] opacity-95" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
