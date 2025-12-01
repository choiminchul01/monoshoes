"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { Plus, Edit2, Trash2, X, Save, Ticket } from "lucide-react";

type Coupon = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
    usage_limit: number | null;
    usage_per_user: number;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
};

export default function AdminCouponsPage() {
    const toast = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 10,
        min_order_amount: 0,
        max_discount_amount: null as number | null,
        usage_limit: null as number | null,
        usage_per_user: 1,
        valid_until: '',
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setCoupons(data);
        setLoading(false);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            type: 'percentage',
            discount_value: 10,
            min_order_amount: 0,
            max_discount_amount: null,
            usage_limit: null,
            usage_per_user: 1,
            valid_until: '',
            is_active: true
        });
        setEditingCoupon(null);
    };

    const handleOpenModal = (coupon?: Coupon) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code,
                name: coupon.name,
                description: coupon.description || '',
                type: coupon.type,
                discount_value: coupon.discount_value,
                min_order_amount: coupon.min_order_amount,
                max_discount_amount: coupon.max_discount_amount,
                usage_limit: coupon.usage_limit,
                usage_per_user: coupon.usage_per_user,
                valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
                is_active: coupon.is_active
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            code: formData.code.toUpperCase(),
            valid_until: formData.valid_until ? `${formData.valid_until}T23:59:59` : null
        };

        try {
            if (editingCoupon) {
                const { error } = await supabase
                    .from('coupons')
                    .update(payload)
                    .eq('id', editingCoupon.id);
                if (error) throw error;
                toast.success('쿠폰이 수정되었습니다.');
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert(payload);
                if (error) throw error;
                toast.success('쿠폰이 생성되었습니다.');
            }
            setIsModalOpen(false);
            fetchCoupons();
        } catch (error) {
            console.error('Error saving coupon:', error);
            toast.error('쿠폰 저장에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 쿠폰을 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success('쿠폰이 삭제되었습니다.');
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('쿠폰 삭제에 실패했습니다.');
        }
    };

    return (
        <div>
            {/* Title Row */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">쿠폰 관리</h1>
            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    쿠폰 생성
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">코드/이름</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">할인</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">조건</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유효기간</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center">로딩 중...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">등록된 쿠폰이 없습니다.</td></tr>
                        ) : (
                            coupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                <Ticket className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{coupon.code}</div>
                                                <div className="text-sm text-gray-500">{coupon.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {coupon.type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString()}원`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div>최소 {coupon.min_order_amount.toLocaleString()}원</div>
                                        {coupon.max_discount_amount && (
                                            <div className="text-xs text-gray-400">최대 {coupon.max_discount_amount.toLocaleString()}원 할인</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : '무제한'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {coupon.is_active ? '활성' : '비활성'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(coupon)} className="p-2 text-blue-500 hover:text-blue-700">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(coupon.id)} className="p-2 text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingCoupon ? '쿠폰 수정' : '새 쿠폰 생성'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">쿠폰 코드</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full border rounded p-2 uppercase"
                                        placeholder="WELCOME2024"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">쿠폰 이름</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border rounded p-2"
                                        placeholder="신규 가입 환영 쿠폰"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">설명</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded p-2"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">할인 타입</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                                        className="w-full border rounded p-2"
                                    >
                                        <option value="percentage">퍼센트 (%)</option>
                                        <option value="fixed">정액 (원)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">할인 값</label>
                                    <input
                                        type="number"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                        className="w-full border rounded p-2"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">최소 주문 금액</label>
                                    <input
                                        type="number"
                                        value={formData.min_order_amount}
                                        onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">최대 할인 금액 (퍼센트일 때)</label>
                                    <input
                                        type="number"
                                        value={formData.max_discount_amount || ''}
                                        onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full border rounded p-2"
                                        placeholder="제한 없음"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">유효기간 (선택)</label>
                                    <input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span>활성화</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                                >
                                    <Save className="w-4 h-4 inline mr-2" />
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
