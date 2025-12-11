import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';

type PointBalance = {
    balance: number;
    total_earned: number;
    total_used: number;
};

type PointTransaction = {
    id: string;
    type: 'earn' | 'use' | 'expire' | 'admin';
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
};

export function usePoints() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<PointBalance>({ balance: 0, total_earned: 0, total_used: 0 });
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPoints = useCallback(async () => {
        if (!user) return;

        const { data } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setBalance(data);
        } else {
            // 사용자 포인트 레코드가 없으면 생성
            const { data: newData } = await supabase
                .from('user_points')
                .insert({ user_id: user.id, balance: 0, total_earned: 0, total_used: 0 })
                .select()
                .single();

            if (newData) setBalance(newData);
        }
    }, [user]);

    const fetchTransactions = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        const { data } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setTransactions(data);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchPoints();
            fetchTransactions();
        }
    }, [user, fetchPoints, fetchTransactions]);

    const canUsePoints = (amount: number): boolean => {
        return balance.balance >= amount;
    };

    return {
        balance,
        transactions,
        loading,
        canUsePoints,
        refetch: () => {
            fetchPoints();
            fetchTransactions();
        }
    };
}

