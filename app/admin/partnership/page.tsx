"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminPermissions } from "@/lib/useAdminPermissions";
import { useToast } from "@/context/ToastContext";
import { Mail, Phone, User, Calendar, MessageSquare, ExternalLink, Trash2, Eye, X } from "lucide-react";

interface PartnerInquiry {
    id: string;
    name: string;
    email: string;
    phone: string;
    inquiry_type: string;
    message: string;
    status: 'pending' | 'replied' | 'closed';
    created_at: string;
}

export default function PartnershipPage() {
    const toast = useToast();
    const { isMaster, loading: permLoading } = useAdminPermissions();
    const [inquiries, setInquiries] = useState<PartnerInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState<PartnerInquiry | null>(null);

    useEffect(() => {
        if (!permLoading && isMaster) {
            fetchInquiries();
        }
    }, [permLoading, isMaster]);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('partner_inquiries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInquiries(data || []);
        } catch (error) {
            console.error('Error fetching partner inquiries:', error);
            // Table might not exist yet
            setInquiries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: 'pending' | 'replied' | 'closed') => {
        try {
            const { error } = await supabase
                .from('partner_inquiries')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            toast.success('상태가 업데이트되었습니다.');
            fetchInquiries();
            if (selectedInquiry?.id === id) {
                setSelectedInquiry({ ...selectedInquiry, status });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('상태 업데이트 실패');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 문의를 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase
                .from('partner_inquiries')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('문의가 삭제되었습니다.');
            fetchInquiries();
            if (selectedInquiry?.id === id) {
                setSelectedInquiry(null);
            }
        } catch (error) {
            console.error('Error deleting inquiry:', error);
            toast.error('삭제 실패');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">대기중</span>;
            case 'replied':
                return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">답변완료</span>;
            case 'closed':
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">종료</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
        }
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
            {/* Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">에센시아 파트너십</h1>
                <p className="text-gray-500 mt-1">제휴 문의 관리</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                    <div className="text-sm text-gray-500">대기중</div>
                    <div className="text-2xl font-bold">{inquiries.filter(i => i.status === 'pending').length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="text-sm text-gray-500">답변완료</div>
                    <div className="text-2xl font-bold">{inquiries.filter(i => i.status === 'replied').length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-400">
                    <div className="text-sm text-gray-500">전체</div>
                    <div className="text-2xl font-bold">{inquiries.length}</div>
                </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">문의유형</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center">로딩 중...</td></tr>
                        ) : inquiries.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">
                                제휴 문의가 없습니다.
                                <p className="text-sm mt-2">아래 SQL을 실행하여 테이블을 생성하세요.</p>
                            </td></tr>
                        ) : (
                            inquiries.map((inquiry) => (
                                <tr key={inquiry.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{inquiry.name}</div>
                                        <div className="text-sm text-gray-500">{inquiry.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{inquiry.phone}</td>
                                    <td className="px-6 py-4 text-sm">{inquiry.inquiry_type}</td>
                                    <td className="px-6 py-4">{getStatusBadge(inquiry.status)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(inquiry.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedInquiry(inquiry)}
                                                className="p-2 text-blue-500 hover:text-blue-700"
                                                title="상세보기"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(inquiry.id)}
                                                className="p-2 text-red-500 hover:text-red-700"
                                                title="삭제"
                                            >
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

            {/* Detail Modal */}
            {selectedInquiry && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-card w-full max-w-lg">
                        <div className="admin-modal-header">
                            <h2>제휴 문의 상세</h2>
                            <button onClick={() => setSelectedInquiry(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="admin-modal-body space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-xs text-gray-500">이름</div>
                                    <div className="font-medium">{selectedInquiry.name}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-xs text-gray-500">이메일</div>
                                    <a href={`mailto:${selectedInquiry.email}`} className="font-medium text-[#00704A] hover:underline">
                                        {selectedInquiry.email}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-xs text-gray-500">전화번호</div>
                                    <a href={`tel:${selectedInquiry.phone}`} className="font-medium text-[#00704A] hover:underline">
                                        {selectedInquiry.phone}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <div className="text-xs text-gray-500">등록일</div>
                                    <div className="font-medium">{new Date(selectedInquiry.created_at).toLocaleString()}</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 mb-2">문의 유형</div>
                                <div className="font-medium">{selectedInquiry.inquiry_type}</div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 mb-2">문의 내용</div>
                                <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                                    {selectedInquiry.message}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 mb-2">상태 변경</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleStatusChange(selectedInquiry.id, 'pending')}
                                        className={`px-3 py-2 rounded-lg text-sm ${selectedInquiry.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        대기중
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedInquiry.id, 'replied')}
                                        className={`px-3 py-2 rounded-lg text-sm ${selectedInquiry.status === 'replied' ? 'bg-[#00704A] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        답변완료
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedInquiry.id, 'closed')}
                                        className={`px-3 py-2 rounded-lg text-sm ${selectedInquiry.status === 'closed' ? 'bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    >
                                        종료
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-0 border-t border-gray-100 mt-4 pt-4">
                            <button
                                onClick={() => setSelectedInquiry(null)}
                                className="w-full admin-btn-primary"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
