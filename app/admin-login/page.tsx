"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Shield } from "lucide-react";

// Admin email validation is now handled by admin_roles table in database
// This removes the hardcoded email from client-side code for security

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        class Particle {
            x: number;
            y: number;
            speedY: number;
            speedX: number;
            size: number;
            alpha: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h; // Start randomly on screen
                this.speedY = Math.random() * -0.5 - 0.2; // Slow upward movement
                this.speedX = Math.random() * 0.4 - 0.2; // Slight horizontal drift
                this.size = Math.random() * 2 + 1; // Small, elegant size
                this.alpha = Math.random() * 0.5 + 0.1; // Subtle opacity
            }

            update(w: number, h: number) {
                this.y += this.speedY;
                this.x += this.speedX;

                // Reset when off screen (top)
                if (this.y < 0) {
                    this.y = h + 10;
                    this.x = Math.random() * w;
                }

                // Wrap around X
                if (this.x > w) this.x = 0;
                if (this.x < 0) this.x = w;
            }

            draw(context: CanvasRenderingContext2D) {
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fillStyle = `rgba(212, 175, 55, ${this.alpha})`; // Essentia Gold (#D4AF37)
                context.fill();
            }
        }

        const particleCount = 40; // Minimal count for "Clutter-free" look
        const particles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(canvas.width, canvas.height));
        }

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        const animate = () => {
            // Clear completely for no trails (Clean look)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                particle.update(canvas.width, canvas.height);
                particle.draw(ctx);
            });

            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Attempt Supabase sign in
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw authError;
            }

            // Check if user has admin role in database
            let { data: roleData, error: roleError } = await supabase
                .from('admin_roles')
                .select('role')
                .eq('user_id', data.user.id)
                .single();

            // If not found by user_id, check by email and link if exists
            if (!roleData && data.user.email) {
                const { data: emailData, error: emailError } = await supabase
                    .from('admin_roles')
                    .select('*')
                    .eq('email', data.user.email)
                    .single();

                if (emailData) {
                    // Found by email, update user_id to link account
                    const { error: updateError } = await supabase
                        .from('admin_roles')
                        .update({ user_id: data.user.id })
                        .eq('email', data.user.email);

                    if (!updateError) {
                        roleData = { role: emailData.role };
                        roleError = null;
                    }
                }
            }

            if (roleError || !roleData) {
                // Sign out if not an admin
                await supabase.auth.signOut();
                throw new Error('관리자 권한이 없습니다. 등록된 관리자 이메일로 로그인해주세요.');
            }

            // Login successful, redirect to admin
            window.location.href = '/admin';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative bg-gradient-to-b from-[#001E10] to-[#000000]">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
            />

            {/* Brand Watermark */}
            <div className="absolute inset-0 flex items-start pt-12 md:pt-0 md:items-center justify-center pointer-events-none z-0 overflow-hidden">
                <h1
                    className="text-[13vw] md:text-[13vw] font-bold text-[#D4AF37] opacity-30 select-none whitespace-nowrap tracking-widest"
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                    ESSENTIA
                </h1>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full space-y-8 bg-[#FDFCF5] p-8 rounded-lg shadow-xl border border-black">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00704A]/20 rounded-full mb-4">
                            <Shield className="w-8 h-8 text-[#00704A]" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Admin Login</h2>
                        <p className="mt-2 text-sm text-gray-600">관리자 전용 로그인</p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Admin Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-white border border-gray-300 py-3 px-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent sm:text-sm"
                                    placeholder="admin@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-md bg-white border border-gray-300 py-3 px-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent sm:text-sm"
                                    placeholder="••••••••"
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
                                {loading ? '로그인 중...' : 'Admin Login'}
                            </button>
                        </div>

                        <div className="text-center">
                            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
                                ← 홈으로 돌아가기
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
