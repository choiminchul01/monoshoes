"use client";

import React from 'react';
import { usePoints } from '@/lib/usePoints';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import PointBalance from '@/components/point/PointBalance';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MyPointsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { balance, transactions, loading } = usePoints();

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'earn':
                return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
            case 'use':
                return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'earn':
                return '적립';
            case 'use':
                return '사용';
            case 'expire':
                return '만료';
            case 'admin':
                return '관리자 처리';
            default:
                return type;
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
                <h1 className="text-3xl font-bold mb-8">내 포인트</h1>

                {/* Point Balance Card */}
                <div className="mb-8">
                    <PointBalance />
                </div>

                {/* Transactions */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold">포인트 내역</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500">로딩 중...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-20">
                            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">포인트 내역이 없습니다.</p>
                            <p className="text-sm text-gray-400 mt-2">주문 완료 시 자동으로 포인트가 적립됩니다.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {transactions.map((transaction) => (
                                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {getTypeIcon(transaction.type)}
                                            <div>
                                                <div className="font-medium">{transaction.description}</div>
                                                <div className="text-sm text-gray-500 mt-0.5">
                                                    {new Date(transaction.created_at).toLocaleString('ko-KR')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}P
                                            </div>
                                            <div className="text-sm text-gray-500 mt-0.5">
                                                잔액: {transaction.balance_after.toLocaleString()}P
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Note */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-2">포인트 안내</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 주문 완료 시 결제 금액의 1%가 자동으로 적립됩니다.</li>
                        <li>• 포인트는 다음 주문 시 현금처럼 사용할 수 있습니다.</li>
                        <li>• 적립된 포인트는 1년 후 자동 소멸됩니다.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
