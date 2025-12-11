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

        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
        }> = [];

        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 4 + 2,
            });
        }

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        const animate = () => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.x < 0 || particle.x > canvas.width) {
                    particle.vx *= -1;
                }
                if (particle.y < 0 || particle.y > canvas.height) {
                    particle.vy *= -1;
                }

                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = '#00704A';
                ctx.fill();
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
            const { data: roleData, error: roleError } = await supabase
                .from('admin_roles')
                .select('role')
                .eq('user_id', data.user.id)
                .single();

            if (roleError || !roleData) {
                // Sign out if not an admin
                await supabase.auth.signOut();
                throw new Error('관리자 권한이 없습니다. 일반 로그인은 /login을 이용해주세요.');
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
        <div className="min-h-screen relative bg-white">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
            />
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
