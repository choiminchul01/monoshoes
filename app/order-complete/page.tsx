"use client";

import Link from "next/link";
import { CheckCircle, Copy, MessageCircle } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrderCompleteContent() {
    const [copied, setCopied] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [emailSent, setEmailSent] = useState(false);
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('orderNumber');

    useEffect(() => {
        if (!orderNumber) {
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            const { supabase } = await import('@/lib/supabase');

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('order_number', orderNumber)
                .single();

            if (error) {
                console.error('주문 조회 실패:', error);
            } else {
                setOrderData(data);

                // 이메일 발송 (이미 발송되지 않았고, 이메일 정보가 있는 경우)
                // user_email 컬럼이 있다고 가정. 없으면 auth user 정보에서 가져와야 할 수도 있음.
                if (data && !emailSent && data.user_email) {
                    try {
                        const response = await fetch('/api/send-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                email: data.user_email,
                                orderNumber: orderNumber,
                                orderData: data,
                            }),
                        });

                        if (response.ok) {
                            setEmailSent(true);
                            console.log('이메일 발송 성공');
                        } else {
                            console.error('이메일 발송 실패');
                        }
                    } catch (err) {
                        console.error('이메일 발송 중 오류:', err);
                    }
                }
            }
            setLoading(false);
        };

        fetchOrder();
    }, [orderNumber, emailSent]);

    const orderDate = orderData
        ? new Date(orderData.created_at).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : new Date().toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    const bankInfo = {
        bank: "국민은행",
        account: "123-456-789012",
        holder: "에센시아",
        amount: orderData?.final_amount || 0
    };

    const handleCopyAccount = () => {
        navigator.clipboard.writeText(bankInfo.account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleKakaoChat = () => {
        // 아래 URL을 실제 카카오톡 오픈채팅방 링크로 변경하세요
        // 예시: https://open.kakao.com/o/sAbCdEfG
        const kakaoOpenChatUrl = "https://open.kakao.com/o/YOUR_CHAT_ID";
        window.open(kakaoOpenChatUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">주문 정보를 불러오는 중...</div>
            </div>
        );
    }

    if (!orderNumber || !orderData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">주문 정보를 찾을 수 없습니다.</p>
                    <Link href="/shop" className="text-black underline">쇼핑 계속하기</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">주문이 완료되었습니다</h1>
                    <p className="text-gray-600">주문 내역은 이메일로도 발송됩니다.</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
                    <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">주문번호</p>
                            <p className="text-lg font-bold text-gray-900">{orderNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">주문일시</p>
                            <p className="text-sm font-medium text-gray-900">{orderDate}</p>
                        </div>
                    </div>

                    <div className="border-2 border-black rounded-lg p-6 mb-6" style={{ backgroundColor: '#F4EFE8' }}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-black rounded-full"></span>
                            입금 계좌 안내
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">은행</span>
                                <span className="text-base font-bold text-gray-900">{bankInfo.bank}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">계좌번호</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-gray-900">{bankInfo.account}</span>
                                    <button
                                        onClick={handleCopyAccount}
                                        className="p-1.5 rounded transition-colors"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                                        title="계좌번호 복사"
                                    >
                                        <Copy className={`w-4 h-4 ${copied ? 'text-green-600' : 'text-gray-600'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">예금주</span>
                                <span className="text-base font-bold text-gray-900">{bankInfo.holder}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.15)' }}>
                                <span className="text-base font-bold text-gray-900">입금액</span>
                                <span className="text-xl font-bold text-gray-900">{bankInfo.amount.toLocaleString()}원</span>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-gray-700 bg-white/70 p-3 rounded" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                            ⏰ 주문 후 <span className="font-bold text-red-600">24시간 이내</span> 입금이 확인되지 않으면 주문이 자동 취소됩니다.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 mb-3">문의하기</p>
                        <button
                            onClick={handleKakaoChat}
                            className="w-full flex items-center justify-center gap-2 h-14 text-gray-900 border-2 border-black font-bold rounded-md transition-colors"
                            style={{ backgroundColor: '#F4EFE8' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EBE4DA'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F4EFE8'}
                        >
                            <MessageCircle className="w-5 h-5" />
                            카카오톡 1:1 문의
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            * 입금 확인 후 배송 준비가 시작됩니다.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/shop"
                        className="flex-1 h-14 bg-white text-gray-900 border-2 border-gray-300 font-bold rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                        쇼핑 계속하기
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 h-14 bg-black text-white font-bold rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center"
                    >
                        홈으로 돌아가기
                    </Link>
                </div>

                <div className="mt-8 p-6 bg-gray-100 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-3">안내사항</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex gap-2">
                            <span className="text-gray-400">•</span>
                            <span>입금자명과 주문자명이 다를 경우, 고객센터로 연락 부탁드립니다.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-gray-400">•</span>
                            <span>주문 내역 및 배송 조회는 마이페이지에서 확인 가능합니다.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-gray-400">•</span>
                            <span>입금 확인 후 영업일 기준 2-3일 이내 배송됩니다.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function OrderCompletePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">주문 정보를 불러오는 중...</div>
            </div>
        }>
            <OrderCompleteContent />
        </Suspense>
    );
}
