"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminPermissions, AdminPermissions, AdminRole, AdminRoleData } from "@/lib/useAdminPermissions";
import { useToast } from "@/context/ToastContext";
import { Plus, Edit2, Trash2, X, Save, Shield, User, Users } from "lucide-react";
import { saveAdminAction, deleteAdminAction } from "./actions";

// 스태프 고정 권한: 상품등록 + 고객관리 + 고객DB(마케팅) 만 허용
const STAFF_FIXED_PERMISSIONS: AdminPermissions = {
    dashboard: true,
    customers: true,
    orders: false,
    products: true,
    reviews: false,
    board: false,
    coupons: false,
    inquiries: false,
    settings: false
};

export default function AdminAccountsPage() {
    const toast = useToast();
    const { isMaster, loading: permLoading } = useAdminPermissions();
    const [admins, setAdmins] = useState<AdminRoleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminRoleData | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        role: "staff" as AdminRole,
        permissions: {
            dashboard: true,
            customers: false,
            orders: false,
            products: false,
            reviews: false,
            board: false,
            coupons: false,
            inquiries: false,
            settings: false
        } as AdminPermissions
    });

    useEffect(() => {
        if (!permLoading && isMaster) {
            fetchAdmins();
        }
    }, [permLoading, isMaster]);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_roles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAdmins(data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            toast.error('관리자 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (admin?: AdminRoleData) => {
        if (admin) {
            setEditingAdmin(admin);
            setFormData({
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            });
        } else {
            setEditingAdmin(null);
            setFormData({
                email: "",
                role: "staff",
                permissions: { ...STAFF_FIXED_PERMISSIONS }
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            toast.error('이메일을 입력해주세요.');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const result = await saveAdminAction({
                id: editingAdmin?.id,
                email: formData.email,
                role: formData.role,
                permissions: formData.permissions,
                createdBy: user?.id
            });

            if (!result.success) {
                if (result.code === '23505') {
                    toast.error('이미 등록된 이메일입니다.');
                } else {
                    throw new Error(result.error);
                }
                return;
            }

            toast.success(editingAdmin ? '관리자 정보가 수정되었습니다.' : '관리자가 추가되었습니다. 해당 이메일로 가입 후 접근 가능합니다.');
            setIsModalOpen(false);
            fetchAdmins();
        } catch (error: any) {
            console.error('Error saving admin:', error);
            toast.error('관리자 저장 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (id: string, email: string, role: AdminRole) => {
        if (role === 'master') {
            toast.error('마스터 계정은 삭제할 수 없습니다.');
            return;
        }

        if (!confirm(`정말 이 관리자를 삭제하시겠습니까?\n${email}`)) return;

        try {
            const result = await deleteAdminAction(id);
            if (!result.success) throw new Error(result.error);

            toast.success('관리자가 삭제되었습니다.');
            fetchAdmins();
        } catch (error) {
            console.error('Error deleting admin:', error);
            toast.error('관리자 삭제 중 오류가 발생했습니다.');
        }
    };

    const togglePermission = (key: keyof AdminPermissions) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const getRoleBadgeColor = (role: AdminRole) => {
        switch (role) {
            case 'master':  return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'staff':   return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'partner': return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const getRoleIcon = (role: AdminRole) => {
        switch (role) {
            case 'master':  return <Shield className="w-4 h-4" />;
            case 'manager': return <Users className="w-4 h-4" />;
            case 'staff':   return <User className="w-4 h-4" />;
            case 'partner': return <User className="w-4 h-4" />;
        }
    };

    const getPermissionCount = (permissions: AdminPermissions) => {
        return Object.values(permissions).filter(Boolean).length;
    };

    if (permLoading) {
        return <div className="p-8 text-center">로딩 중...</div>;
    }

    if (!isMaster) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">마스터 관리자만 접근 가능합니다.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Title Row */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold">관리자 계정 관리</h1>
            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    관리자 추가
                </button>
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">권한</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">로딩 중...</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">등록된 관리자가 없습니다.</td></tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium">{admin.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(admin.role)}`}>
                                            {getRoleIcon(admin.role)}
                                            {admin.role === 'master'  && '마스터'}
                                            {admin.role === 'manager' && '매니저'}
                                            {admin.role === 'staff'   && '스태프'}
                                            {admin.role === 'partner' && '파트너사'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">
                                            {admin.role === 'master' ? '전체 권한' : `${getPermissionCount(admin.permissions)}개 메뉴`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(admin.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {admin.role !== 'master' && (
                                                <>
                                                    <button
                                                        onClick={() => handleOpenModal(admin)}
                                                        className="p-2 text-blue-500 hover:text-blue-700"
                                                        title="수정"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(admin.id, admin.email, admin.role)}
                                                        className="p-2 text-red-500 hover:text-red-700"
                                                        title="삭제"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-card w-full max-w-md">
                        <div className="admin-modal-header">
                            <h2>
                                {editingAdmin ? '관리자 수정' : '관리자 추가'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="admin-modal-body space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!!editingAdmin}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A] disabled:bg-gray-100"
                                    required
                                />
                                {!editingAdmin && (
                                    <p className="mt-1 text-xs text-gray-500">해당 이메일로 가입 후 관리자 권한이 부여됩니다.</p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => {
                                        const newRole = e.target.value as AdminRole;
                                        setFormData(prev => ({
                                            ...prev,
                                            role: newRole,
                                            permissions: newRole === 'staff' ? { ...STAFF_FIXED_PERMISSIONS } : prev.permissions
                                        }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A]"
                                >
                                    <option value="staff">스태프 (Staff)</option>
                                    <option value="manager">매니저 (Manager)</option>
                                    <option value="partner">파트너 (Partner)</option>
                                </select>
                                {formData.role === 'staff' && (
                                    <p className="mt-1 text-xs text-amber-600">⚠ 스태프는 상품관리·고객관리·고객DB 권한만 부여됩니다.</p>
                                )}
                            </div>

                            {/* Permissions */}
                            <div className={formData.role === 'staff' ? 'opacity-60 pointer-events-none' : ''}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">접근 가능 메뉴 {formData.role === 'staff' && <span className="text-xs text-amber-600 ml-1">(스태프 고정)</span>}</label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">

                                    {/* 대시보드 */}
                                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">대시보드</p>
                                    </div>
                                    <div className="px-3 py-2 border-b border-gray-100">
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                            <input type="checkbox" checked={formData.permissions['dashboard']} onChange={() => togglePermission('dashboard')} className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black" />
                                            <span>대시보드</span>
                                        </label>
                                    </div>

                                    {/* 쇼핑몰 관리 */}
                                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">쇼핑몰 관리</p>
                                    </div>
                                    <div className="px-3 py-2 border-b border-gray-100 space-y-1">
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                            <input type="checkbox" checked={formData.permissions['products']} onChange={() => togglePermission('products')} className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black" />
                                            <span>상품 관리</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                            <input type="checkbox" checked={formData.permissions['board']} onChange={() => togglePermission('board')} className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black" />
                                            <span>이벤트/팝업 관리</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                            <input type="checkbox" checked={formData.permissions['reviews']} onChange={() => togglePermission('reviews')} className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black" />
                                            <span>리뷰 관리</span>
                                        </label>
                                    </div>

                                    {/* 고객 및 마케팅 */}
                                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">고객 및 마케팅</p>
                                    </div>
                                    <div className="px-3 py-2 border-b border-gray-100 space-y-1">
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                            <input type="checkbox" checked={formData.permissions['customers']} onChange={() => togglePermission('customers')} className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black" />
                                            <span>고객 관리 + 고객 DB (마케팅)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                            <input type="checkbox" checked={formData.permissions['inquiries']} onChange={() => togglePermission('inquiries')} className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black" />
                                            <span>문의 관리</span>
                                        </label>
                                    </div>

                                    {/* 시스템 */}
                                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">시스템</p>
                                    </div>
                                    <div className="px-3 py-2 space-y-1">
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                            <input type="checkbox" checked={formData.permissions['settings']} onChange={() => togglePermission('settings')} className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black" />
                                            <span>설정</span>
                                        </label>
                                        <div className="flex items-center gap-2 p-1.5 rounded opacity-40 cursor-not-allowed select-none">
                                            <input type="checkbox" disabled checked className="w-4 h-4 border-gray-300 rounded" />
                                            <span>관리자 계정</span>
                                            <span className="text-[10px] text-purple-500 ml-auto font-bold">마스터 전용</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 admin-btn-primary"
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
