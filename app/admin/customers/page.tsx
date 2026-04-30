"use client";

import React, { useState, useCallback } from "react";
import { User, RefreshCw, ChevronLeft, ChevronRight, Search, KeyRound, X, Eye, EyeOff } from "lucide-react";
import { fetchRealLeadsAction, getRealLeadsCountAction, fetchAllUsersAction, resetUserPasswordAction } from "./actions";
import { useAdminPermissions } from "@/lib/useAdminPermissions";

type Customer = {
    id: number | string;
    name: string;
    phone: string;
    birth_date?: string | null;
    gender?: string;
    address_sido?: string | null;
    address_sigungu?: string | null;
    created_at: string;
};

type AuthUser = {
    id: string;
    email: string;
    name: string;
    phone: string;
    created_at: string;
    last_sign_in_at: string | null;
};

const PAGE_SIZE = 100;
const PAGE_GROUP = 10;

function Paginator({ currentPage, totalPages, onPageChange }: {
    currentPage: number; totalPages: number; onPageChange: (p: number) => void;
}) {
    const groupIndex = Math.floor((currentPage - 1) / PAGE_GROUP);
    const groupStart = groupIndex * PAGE_GROUP + 1;
    const groupEnd = Math.min(groupStart + PAGE_GROUP - 1, totalPages);
    const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
    return (
        <div className="flex items-center justify-center gap-1 py-4">
            <button onClick={() => onPageChange(groupStart - 1)} disabled={groupStart <= 1}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
            </button>
            {pages.map(p => (
                <button key={p} onClick={() => onPageChange(p)}
                    className={`w-8 h-8 text-sm rounded font-medium transition-colors ${p === currentPage ? "bg-black text-white" : "hover:bg-gray-100 text-gray-600"}`}>
                    {p}
                </button>
            ))}
            <button onClick={() => onPageChange(groupEnd + 1)} disabled={groupEnd >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

function SkeletonRows() {
    return <>
        {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i}>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" /><div className="h-3 w-20 bg-gray-100 rounded animate-pulse" /></div></td>
                <td className="px-4 py-3"><div className="h-3 w-28 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-3 w-6 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-3 w-24 bg-gray-100 rounded animate-pulse" /></td>
            </tr>
        ))}
    </>;
}

// ── 비밀번호 변경 모달 ───────────────────────────────────────
function PasswordResetModal({ user, onClose }: { user: AuthUser; onClose: () => void }) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);

        if (newPassword.length < 6) {
            setResult({ type: "error", msg: "비밀번호는 최소 6자 이상이어야 합니다." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setResult({ type: "error", msg: "비밀번호가 일치하지 않습니다." });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await resetUserPasswordAction(user.id, newPassword);
            if (res.success) {
                setResult({ type: "success", msg: "비밀번호가 성공적으로 변경되었습니다." });
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setResult({ type: "error", msg: res.error || "변경 실패" });
            }
        } catch {
            setResult({ type: "error", msg: "서버 오류가 발생했습니다." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-gray-700" />
                        <h2 className="text-lg font-bold">비밀번호 변경</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* 대상 회원 정보 */}
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-500 text-xs mb-1">대상 회원</p>
                        <p className="font-bold text-gray-900">{user.email}</p>
                        {user.name && user.name !== "이름 없음" && (
                            <p className="text-gray-500 text-xs mt-0.5">{user.name}</p>
                        )}
                    </div>

                    {/* 새 비밀번호 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="최소 6자 이상"
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                                required
                                minLength={6}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* 비밀번호 확인 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="비밀번호 재입력"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            required
                            minLength={6}
                        />
                    </div>

                    {/* 결과 메시지 */}
                    {result && (
                        <div className={`text-sm px-3 py-2 rounded-lg ${result.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {result.msg}
                        </div>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                            취소
                        </button>
                        <button type="submit" disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold disabled:opacity-50">
                            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── 가입 회원 목록 (마스터 전용 비번 변경 포함) ─────────────
function MembersSection({ isMaster }: { isMaster: boolean }) {
    const [members, setMembers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [pwTarget, setPwTarget] = useState<AuthUser | null>(null);

    const loadMembers = async () => {
        setLoading(true);
        const res = await fetchAllUsersAction();
        if (res.success && res.users) {
            setMembers(res.users as AuthUser[]);
        }
        setLoading(false);
        setLoaded(true);
    };

    if (!loaded) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-bold">가입 회원 목록</h2>
                    <button onClick={loadMembers} disabled={loading}
                        className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                        {loading ? "로딩..." : "조회"}
                    </button>
                </div>
                <div className="p-8 text-center text-gray-400 text-sm">조회 버튼을 눌러 가입 회원 목록을 불러오세요.</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-bold">가입 회원 <span className="text-gray-400 font-normal text-sm ml-1">{members.length}명</span></h2>
                <button onClick={loadMembers} disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> 새로고침
                </button>
            </div>
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">최근 로그인</th>
                        {isMaster && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">관리</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">로딩 중...</td></tr>
                    ) : members.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">가입된 회원이 없습니다.</td></tr>
                    ) : members.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium">{m.email}</td>
                            <td className="px-4 py-3 text-gray-500">{m.name}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.created_at).toLocaleDateString("ko-KR")}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{m.last_sign_in_at ? new Date(m.last_sign_in_at).toLocaleDateString("ko-KR") : "-"}</td>
                            {isMaster && (
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => setPwTarget(m)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 hover:text-black transition-colors"
                                        title="비밀번호 변경">
                                        <KeyRound className="w-3 h-3" /> 비번변경
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 비밀번호 변경 모달 */}
            {pwTarget && <PasswordResetModal user={pwTarget} onClose={() => setPwTarget(null)} />}
        </div>
    );
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function AdminCustomersPage() {
    const { isMaster, loading: permLoading } = useAdminPermissions();

    const [leads, setLeads] = useState<Customer[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasQueried, setHasQueried] = useState(false);

    const loadData = useCallback(async (page: number, searchVal?: string) => {
        setIsLoading(true);
        try {
            const [countRes, dataRes] = await Promise.all([
                getRealLeadsCountAction(),
                fetchRealLeadsAction({ page, pageSize: PAGE_SIZE, search: searchVal || undefined }),
            ]);
            if (dataRes.success) {
                setLeads(dataRes.data as Customer[]);
                setTotalCount(countRes.count);
            } else {
                setLeads([]);
                setTotalCount(0);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearch = async () => {
        setHasQueried(true);
        setCurrentPage(1);
        setAppliedSearch(search);
        await loadData(1, search || undefined);
    };

    const handlePageChange = async (p: number) => {
        setCurrentPage(p);
        await loadData(p, appliedSearch || undefined);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleRefresh = () => {
        if (!hasQueried) return;
        loadData(currentPage, appliedSearch || undefined);
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">고객 관리</h1>
                    {hasQueried && !isLoading && (
                        <p className="text-sm text-gray-400 mt-1">
                            자사몰 유입 고객{" "}
                            <span className="font-bold text-gray-700">{totalCount.toLocaleString()}</span>명
                        </p>
                    )}
                </div>
                {hasQueried && (
                    <button onClick={handleRefresh} disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> 새로고침
                    </button>
                )}
            </div>

            {/* 가입 회원 섹션 (마스터만 비번변경 버튼 표시) */}
            {!permLoading && <MembersSection isMaster={isMaster} />}

            {/* 로딩 배너 */}
            {isLoading && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>데이터를 가져오는 중입니다... 잠시만 기다려주세요.</span>
                    <span className="ml-auto text-gray-400 text-xs">100건씩 페이지 조회</span>
                </div>
            )}

            {/* Search */}
            <div className="mb-5 flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <input type="text" value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                        placeholder="이름, 전화번호 검색..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-shadow text-sm"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                </div>
                <button onClick={handleSearch} disabled={isLoading}
                    className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0">
                    조회
                </button>
            </div>

            {/* 초기 상태 */}
            {!hasQueried && (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-base font-medium text-gray-500">조회 버튼을 눌러 고객 데이터를 불러오세요</p>
                    <p className="text-sm mt-1">이름 또는 전화번호로 검색하거나, 전체 조회할 수 있습니다.</p>
                </div>
            )}

            {/* Table */}
            {hasQueried && (
                <div className="bg-white rounded-lg shadow overflow-hidden mb-2">
                    {!isLoading && leads.length > 0 && (
                        <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                            <span>
                                {appliedSearch
                                    ? `"${appliedSearch}" 검색 결과 · 총 ${totalCount.toLocaleString()}명`
                                    : `전체 ${totalCount.toLocaleString()}명 · ${currentPage}/${totalPages}페이지`}
                            </span>
                        </div>
                    )}

                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">성별</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생년월일</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <SkeletonRows />
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-14 text-center text-gray-400 text-sm">
                                        {appliedSearch ? `"${appliedSearch}" 검색 결과가 없습니다.` : "자사몰 유입 고객 데이터가 없습니다."}
                                    </td>
                                </tr>
                            ) : (
                                leads.map((c) => (
                                    <tr key={String(c.id)} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                    <User className="w-3.5 h-3.5 text-gray-500" />
                                                </div>
                                                <span className="font-medium">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.phone || "-"}</td>
                                        <td className="px-4 py-3">
                                            {c.gender === "M"
                                                ? <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">남</span>
                                                : c.gender === "F"
                                                    ? <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded border border-pink-200">여</span>
                                                    : <span className="text-[10px] text-gray-300">-</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{c.birth_date || "-"}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {[c.address_sido, c.address_sigungu].filter(Boolean).join(" ") || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {!isLoading && totalPages > 1 && (
                        <div className="border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400 pt-3">페이지당 100건</p>
                            <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
