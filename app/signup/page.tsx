"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
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

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone,
                        address: address,
                        address_detail: addressDetail,
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">회원가입</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/login" className="font-medium text-black hover:underline">
                            로그인하기
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
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
                                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-black focus:ring-black sm:text-sm border"
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
                                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-black focus:ring-black sm:text-sm border"
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
                                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-black focus:ring-black sm:text-sm border"
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
                                className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-black focus:ring-black sm:text-sm border"
                                placeholder="비밀번호 재입력"
                                minLength={6}
                            />
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
                                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-black focus:ring-black sm:text-sm border"
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
                                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-black focus:ring-black sm:text-sm border"
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
                                        className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-black focus:ring-black sm:text-sm border"
                                        placeholder="동/호수 등 상세 주소"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-black px-3 py-3 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:bg-gray-400"
                        >
                            {loading ? '가입 중...' : '회원가입'}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        * 입력하신 연락처와 주소는 추후 상품 주문 시<br />
                        주문서에 자동으로 입력되어 편리하게 이용하실 수 있습니다.
                    </p>
                </form>
            </div>
        </div>
    );
}
