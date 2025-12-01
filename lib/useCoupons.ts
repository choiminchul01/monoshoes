import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

type Coupon = {
    id: string;
    code: string;
    name: string;
    type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
    usage_limit: number | null;
    usage_per_user: number;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
};

type UserCoupon = {
    id: string;
    coupon_id: string;
    is_used: boolean;
    issued_at: string;
    coupons: Coupon;
};

export function useCoupons() {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState<UserCoupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchCoupons();
        }
    }, [user]);

    const fetchCoupons = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('user_coupons')
            .select(`
                *,
                coupons (*)
            `)
            .eq('user_id', user.id)
            .eq('is_used', false);

        if (!error && data) {
            setCoupons(data as UserCoupon[]);
        }
        setLoading(false);
    };

    const registerCoupon = async (code: string) => {
        if (!user) throw new Error('로그인이 필요합니다.');

        // 쿠폰 코드로 쿠폰 찾기
        const { data: coupon, error: couponError } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (couponError || !coupon) {
            throw new Error('유효하지 않은 쿠폰 코드입니다.');
        }

        // 유효기간 확인
        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            throw new Error('만료된 쿠폰입니다.');
        }

        // 이미 발급받았는지 확인
        const { data: existing } = await supabase
            .from('user_coupons')
            .select('*')
            .eq('user_id', user.id)
            .eq('coupon_id', coupon.id)
            .single();

        if (existing) {
            throw new Error('이미 발급받은 쿠폰입니다.');
        }

        // 쿠폰 발급
        const { error: insertError } = await supabase
            .from('user_coupons')
            .insert({
                user_id: user.id,
                coupon_id: coupon.id
            });

        if (insertError) throw insertError;

        await fetchCoupons();
    };

    const calculateDiscount = (coupon: Coupon, orderAmount: number): number => {
        if (orderAmount < coupon.min_order_amount) {
            return 0;
        }

        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = Math.floor(orderAmount * (coupon.discount_value / 100));
            if (coupon.max_discount_amount) {
                discount = Math.min(discount, coupon.max_discount_amount);
            }
        } else {
            discount = coupon.discount_value;
        }

        return Math.min(discount, orderAmount);
    };

    return {
        coupons,
        loading,
        registerCoupon,
        calculateDiscount,
        refetch: fetchCoupons
    };
}
