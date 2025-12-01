"use client";

import React, { useState } from 'react';
import { useCoupons } from '@/lib/useCoupons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import CouponCard from '@/components/coupon/CouponCard';
import { Ticket, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function MyCouponsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const { coupons, loading, registerCoupon, refetch } = useCoupons();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const handleRegisterCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!couponCode.trim()) {
            toast.error('쿠폰 코드를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await registerCoupon(couponCode.trim().toUpperCase());
            toast.success('쿠폰이 등록되었습니다!');
            setCouponCode('');
            setIsModalOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error.message || '쿠폰 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Button */}
                <Link
                    href="/mypage"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>마이페이지로 돌아가기</span>
                </Link>

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">내 쿠폰</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        쿠폰 등록
                    </button>
                </div>

                {/* Coupon List */}
                {loading ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500">로딩 중...</p>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-20 text-center">
                        <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold mb-2">보유한 쿠폰이 없습니다</h3>
                        <p className="text-gray-500 mb-6">쿠폰 코드를 입력하여 쿠폰을 등록해보세요.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                        >
                            쿠폰 등록하기
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {coupons.map((userCoupon) => (
                            <CouponCard
                                key={userCoupon.id}
                                coupon={userCoupon.coupons}
                                is_used={userCoupon.is_used}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Register Coupon Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">쿠폰 등록</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-black"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleRegisterCoupon} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    쿠폰 코드
                                </label>
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="WELCOME10"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black font-mono text-lg"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '등록 중...' : '등록하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
