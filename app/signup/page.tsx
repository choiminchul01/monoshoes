"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function SignupPage() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useParticleAnimation(canvasRef);

    const [isMounted, setIsMounted] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    
    // Consent states
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [agreedThirdParty, setAgreedThirdParty] = useState(false);
    const [agreedMarketing, setAgreedMarketing] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            setLoading(false);
            return;
        }

        if (!agreedTerms || !agreedPrivacy) {
            setError("필수 약관에 동의해주세요.");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone,
                        birthdate: birthdate,
                        gender: gender,
                        address: address,
                        address_detail: addressDetail,
                        consents: {
                            terms: agreedTerms,
                            privacy: agreedPrivacy,
                            third_party: agreedThirdParty,
                            marketing: agreedMarketing,
                            agreed_at: new Date().toISOString()
                        }
                    },
                },
            });

            if (error) throw error;

            alert("회원가입이 완료되었습니다! 로그인해주세요.");
            router.push('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) return null;

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

            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full space-y-8 bg-[#FDFCF5] p-8 rounded-lg shadow-xl border border-[#D4AF37]/30">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">회원가입</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            이미 계정이 있으신가요?{' '}
                            <Link href="/login" className="font-medium text-[#00704A] hover:underline">
                                로그인하기
                            </Link>
                        </p>
                        <div className="mt-4 p-3 bg-[#00704A]/10 text-[#00704A] text-sm rounded-lg font-medium border border-[#00704A]/20">
                            🎉 지금 가입하면 <span className="font-bold">5,000원 할인 쿠폰</span> 즉시 지급!
                        </div>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSignup} autoComplete="off">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                    placeholder="홍길동"
                                />
                            </div>
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
                                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                    placeholder="example@email.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                    placeholder="6자 이상 입력"
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                    placeholder="비밀번호 재입력"
                                    minLength={6}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">생년월일</label>
                                    <input
                                        id="birthdate"
                                        name="birthdate"
                                        type="date"
                                        required
                                        value={birthdate}
                                        onChange={(e) => setBirthdate(e.target.value)}
                                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-[#00704A] focus:border-transparent text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">성별</label>
                                    <div className="mt-1 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setGender('male')}
                                            className={`flex-1 py-2 px-3 text-sm rounded-md border ${gender === 'male' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-700 border-gray-300'} transition-colors`}
                                        >
                                            남성
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGender('female')}
                                            className={`flex-1 py-2 px-3 text-sm rounded-md border ${gender === 'female' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-700 border-gray-300'} transition-colors`}
                                        >
                                            여성
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">추가 정보 (선택)</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">연락처</label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                            placeholder="010-1234-5678"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">주소</label>
                                        <input
                                            id="address"
                                            name="address"
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                            placeholder="기본 주소"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700">상세 주소</label>
                                        <input
                                            id="addressDetail"
                                            name="addressDetail"
                                            type="text"
                                            value={addressDetail}
                                            onChange={(e) => setAddressDetail(e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-[#00704A] focus:border-transparent"
                                            placeholder="동/호수 등 상세 주소"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 약관 동의 섹션 */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                            <div className="flex items-center pb-2 border-b border-gray-200">
                                <input
                                    id="allAgreed"
                                    type="checkbox"
                                    checked={agreedTerms && agreedPrivacy && agreedThirdParty && agreedMarketing}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setAgreedTerms(checked);
                                        setAgreedPrivacy(checked);
                                        setAgreedThirdParty(checked);
                                        setAgreedMarketing(checked);
                                    }}
                                    className="h-4 w-4 text-[#00704A] focus:ring-[#00704A] border-gray-300 rounded"
                                />
                                <label htmlFor="allAgreed" className="ml-2 block text-sm font-bold text-gray-900">전체 동의하기</label>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="terms"
                                            type="checkbox"
                                            required
                                            checked={agreedTerms}
                                            onChange={(e) => setAgreedTerms(e.target.checked)}
                                            className="h-4 w-4 text-[#00704A] focus:ring-[#00704A] border-gray-300 rounded"
                                        />
                                        <label htmlFor="terms" className="ml-2 block text-xs text-gray-700">
                                            <span className="text-red-500 mr-1">(필수)</span> 이용약관 동의
                                        </label>
                                    </div>
                                    <Link href="/terms" className="text-[10px] text-gray-400 hover:underline">보기</Link>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="privacy"
                                            type="checkbox"
                                            required
                                            checked={agreedPrivacy}
                                            onChange={(e) => setAgreedPrivacy(e.target.checked)}
                                            className="h-4 w-4 text-[#00704A] focus:ring-[#00704A] border-gray-300 rounded"
                                        />
                                        <label htmlFor="privacy" className="ml-2 block text-xs text-gray-700">
                                            <span className="text-red-500 mr-1">(필수)</span> 개인정보 수집 및 이용 동의
                                        </label>
                                    </div>
                                    <Link href="/privacy" className="text-[10px] text-gray-400 hover:underline">보기</Link>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="thirdParty"
                                            type="checkbox"
                                            checked={agreedThirdParty}
                                            onChange={(e) => setAgreedThirdParty(e.target.checked)}
                                            className="h-4 w-4 text-[#00704A] focus:ring-[#00704A] border-gray-300 rounded"
                                        />
                                        <label htmlFor="thirdParty" className="ml-2 block text-xs text-gray-700">
                                            <span className="text-gray-400 mr-1">(선택)</span> 개인정보 제3자 제공 동의
                                        </label>
                                    </div>
                                    <div className="group relative">
                                        <span className="text-[10px] text-gray-400 cursor-help underline">상세</span>
                                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-[10px] leading-relaxed text-gray-600">
                                            제공처: 굿가드솔루션, 하이솔루션, 에니스 컴퍼니<br/>
                                            목적: 타겟팅 광고 및 홍보<br/>
                                            항목: 성명, 이메일, 전화번호 등 수집 데이터 일체
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="marketing"
                                        type="checkbox"
                                        checked={agreedMarketing}
                                        onChange={(e) => setAgreedMarketing(e.target.checked)}
                                        className="h-4 w-4 text-[#00704A] focus:ring-[#00704A] border-gray-300 rounded"
                                    />
                                    <label htmlFor="marketing" className="ml-2 block text-xs text-gray-700">
                                        <span className="text-gray-400 mr-1">(선택)</span> 마케팅 정보 수신 동의
                                    </label>
                                </div>
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
                                {loading ? '가입 중...' : '회원가입'}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            * 입력하신 연락처와 주소는 추후 상품 주문 시<br />
                            주문서에 자동으로 입력되어 편리하게 이용하실 수 있습니다.
                        </p>

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
