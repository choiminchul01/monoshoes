"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

// Gold particle animation
function useParticleAnimation(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
    useEffect(() => {
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
    }, [canvasRef]);
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/mypage';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useParticleAnimation(canvasRef);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push(redirectTo);
            router.refresh();
        } catch (err: any) {
            if (err.message === 'Email not confirmed') {
                setError("이메일 인증이 완료되지 않았습니다. 가입하신 이메일함을 확인해 주세요.");
            } else if (err.message === 'Invalid login credentials') {
                setError("이메일 또는 비밀번호가 일치하지 않습니다.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative bg-gradient-to-b from-[#001E10] to-[#000000]">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
            />

            {/* Brand Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <h1
                    className="text-[15vw] font-bold text-[#D4AF37] opacity-20 select-none whitespace-nowrap tracking-widest"
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                    MONO SHOES
                </h1>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full space-y-8 bg-[#FDFCF5] p-8 rounded-lg shadow-xl border border-[#D4AF37]/30">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">로그인</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            계정이 없으신가요?{' '}
                            <Link href="/signup" className="font-medium text-[#00704A] hover:underline">
                                회원가입하기
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleLogin} autoComplete="off">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 py-3 px-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                    placeholder="이메일 주소"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 py-3 px-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                    placeholder="비밀번호"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded-md bg-[#00704A] px-3 py-3 text-sm font-semibold text-white hover:bg-[#005A3C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00704A] disabled:bg-gray-400 transition-colors"
                            >
                                {loading ? '로그인 중...' : '로그인'}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                                ← 홈으로 돌아가기
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#001E10] to-[#000000]">
                <p className="text-white">Loading...</p>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
