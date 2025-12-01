"use client";

import React from 'react';
import { Ticket, Calendar, Percent, DollarSign } from 'lucide-react';

type Coupon = {
    id: string;
    code: string;
    name: string;
    type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
};

type CouponCardProps = {
    coupon: Coupon;
    is_used?: boolean;
    onSelect?: () => void;
    selected?: boolean;
};

export default function CouponCard({ coupon, is_used = false, onSelect, selected = false }: CouponCardProps) {
    const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
    const isDisabled = is_used || isExpired || !coupon.is_active;

    const getDiscountText = () => {
        if (coupon.type === 'percentage') {
            return `${coupon.discount_value}%`;
        }
        return `${coupon.discount_value.toLocaleString()}원`;
    };

    const getValidUntilText = () => {
        if (!coupon.valid_until) return '무제한';
        return new Date(coupon.valid_until).toLocaleDateString('ko-KR');
    };

    return (
        <div
            onClick={!isDisabled && onSelect ? onSelect : undefined}
            className={`relative border-2 rounded-xl overflow-hidden transition-all ${isDisabled
                ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                : selected
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-lg cursor-pointer'
                    : 'border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 hover:shadow-md cursor-pointer'
                }`}
        >
            {/* Left Section - Discount Value */}
            <div className="flex">
                <div className={`w-32 flex flex-col items-center justify-center p-4 ${isDisabled ? 'bg-gray-200' : 'bg-gradient-to-br from-[#D4AF37] to-[#C5A059]'
                    }`}>
                    {coupon.type === 'percentage' ? (
                        <Percent className={`w-6 h-6 mb-2 ${isDisabled ? 'text-gray-400' : 'text-black'}`} />
                    ) : (
                        <DollarSign className={`w-6 h-6 mb-2 ${isDisabled ? 'text-gray-400' : 'text-black'}`} />
                    )}
                    <div className={`text-3xl font-bold ${isDisabled ? 'text-gray-500' : 'text-black'}`}>
                        {getDiscountText()}
                    </div>
                    {coupon.max_discount_amount && coupon.type === 'percentage' && (
                        <div className={`text-xs mt-1 ${isDisabled ? 'text-gray-400' : 'text-black/80'}`}>
                            최대 {coupon.max_discount_amount.toLocaleString()}원
                        </div>
                    )}
                </div>

                {/* Right Section - Coupon Details */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-lg mb-2">{coupon.name}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4" />
                                <span className="font-mono font-semibold text-black">{coupon.code}</span>
                            </div>
                            {coupon.min_order_amount > 0 && (
                                <div className="text-xs">
                                    {coupon.min_order_amount.toLocaleString()}원 이상 구매 시
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>~ {getValidUntilText()}</span>
                        </div>
                        {is_used && (
                            <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                사용완료
                            </span>
                        )}
                        {isExpired && !is_used && (
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                                만료됨
                            </span>
                        )}
                        {selected && !isDisabled && (
                            <span className="text-xs font-bold text-black bg-[#D4AF37] px-2 py-0.5 rounded">
                                선택됨
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
