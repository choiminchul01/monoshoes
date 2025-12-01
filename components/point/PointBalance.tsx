"use client";

import React from 'react';
import { usePoints } from '@/lib/usePoints';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';

export default function PointBalance({ compact = false }: { compact?: boolean }) {
    const { balance, loading } = usePoints();

    if (loading) {
        return (
            <div className={`bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl p-4 text-white animate-pulse ${compact ? 'h-20' : 'h-32'}`}>
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5" />
                        <span className="text-sm font-medium">내 포인트</span>
                    </div>
                    <div className="text-xl font-bold">
                        {balance.balance.toLocaleString()}P
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
                <Coins className="w-6 h-6" />
                <h3 className="text-lg font-bold">내 포인트</h3>
            </div>

            <div className="mb-6">
                <div className="text-4xl font-bold mb-1">
                    {balance.balance.toLocaleString()}P
                </div>
                <div className="text-sm text-white/80">사용 가능한 포인트</div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                <div>
                    <div className="flex items-center gap-1 text-xs text-white/80 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>총 적립</span>
                    </div>
                    <div className="text-lg font-bold">
                        {balance.total_earned.toLocaleString()}P
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-xs text-white/80 mb-1">
                        <TrendingDown className="w-3 h-3" />
                        <span>총 사용</span>
                    </div>
                    <div className="text-lg font-bold">
                        {balance.total_used.toLocaleString()}P
                    </div>
                </div>
            </div>
        </div>
    );
}
