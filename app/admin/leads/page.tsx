"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Download, Filter, Users, TrendingUp, X, RefreshCw, ChevronLeft, ChevronRight, Database, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { fetchLeadsAction, getLeadsStatsAction, getLeadsRegionsAction, generateFakeLeadsAction, generateRealLeadsAction, deleteFakeLeadsAction, deleteAllRealLeadsAction, deleteLeadAction, deleteLeadsByRangeAction, resetAllLeadsAction } from "./actions";
import { useAdminPermissions } from "@/lib/useAdminPermissions";

type Lead = {
    id: number;
    phone: string;
    name: string;
    birth_date: string | null;
    gender: string | null;
    address: string | null;
    address_sido: string | null;
    address_sigungu: string | null;
    address_dong: string | null;
    is_real: boolean;
};

type Stats = {
    total: number;
    male: number;
    female: number;
    realCount: number;
    fakeCount: number;
    recentBatches: any[];
};

const AGE_GROUPS = [
    { value: "", label: "전체 나이" },
    { value: "10s", label: "10대" },
    { value: "20s", label: "20대" },
    { value: "30s", label: "30대" },
    { value: "40s", label: "40대" },
    { value: "50s", label: "50대" },
    { value: "60s", label: "60대" },
    { value: "70s+", label: "70대+" },
];

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, male: 0, female: 0, realCount: 0, fakeCount: 0, recentBatches: [] });
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 100;
    const { isMaster } = useAdminPermissions();

    // 필터 상태
    const [sido, setSido] = useState("");
    const [sigungu, setSigungu] = useState("");
    const [dong, setDong] = useState("");
    const [gender, setGender] = useState("");
    const [ageGroup, setAgeGroup] = useState("");
    const [idStart, setIdStart] = useState("");
    const [idEnd, setIdEnd] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isRealFilter, setIsRealFilter] = useState<"T" | "F" | "">("");

    // 지역 목록
    const [sidoList, setSidoList] = useState<string[]>([]);
    const [sigunguList, setSigunguList] = useState<string[]>([]);

    // UI 상태
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadIsReal, setUploadIsReal] = useState(false);   // 기본값: 외부 유입(F)
    const [uploadIgnoreDuplicates, setUploadIgnoreDuplicates] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<{ uploaded: number; skipped: number; failed: number; total: number } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [rangeDeleteStart, setRangeDeleteStart] = useState("");
    const [rangeDeleteEnd, setRangeDeleteEnd] = useState("");

    // 통계 로드
    useEffect(() => {
        getLeadsStatsAction().then(setStats);
        getLeadsRegionsAction("sido").then(setSidoList);
    }, []);

    // 시/도 변경 시 시/군/구 로드
    useEffect(() => {
        if (sido) {
            getLeadsRegionsAction("sigungu", sido).then(setSigunguList);
            setSigungu("");
            setDong("");
        } else {
            setSigunguList([]);
            setSigungu("");
            setDong("");
        }
    }, [sido]);

    // 드롭다운 필터 변경 시 자동 조회
    useEffect(() => {
        setPage(1);
        fetchData(1);
    }, [sido, sigungu, dong, gender, ageGroup, isRealFilter]);

    // 데이터 조회
    const fetchData = useCallback(async (p = 1) => {
        setIsLoading(true);
        const result = await fetchLeadsAction({
            sido: sido || undefined,
            sigungu: sigungu || undefined,
            dong: dong || undefined,
            gender: gender || undefined,
            ageGroup: ageGroup || undefined,
            isReal: isRealFilter || undefined,
            idStart: idStart ? parseInt(idStart) : undefined,
            idEnd: idEnd ? parseInt(idEnd) : undefined,
            search: searchTerm || undefined,
            page: p,
            pageSize: PAGE_SIZE,
        });
        if (result.success) {
            setLeads(result.data as Lead[]);
            setTotalCount(result.count);
        }
        setIsLoading(false);
    }, [sido, sigungu, dong, gender, ageGroup, isRealFilter, idStart, idEnd, searchTerm]);

    // 드롭다운 필터 변경 시 자동 조회 (텍스트 입력 시엔 자동조회 막음)
    useEffect(() => {
        setPage(1);
        fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sido, sigungu, dong, gender, ageGroup, isRealFilter]);

    const handleSearch = () => {
        setPage(1);
        fetchData(1);
    };

    const handleReset = () => {
        setSido(""); setSigungu(""); setDong("");
        setGender(""); setAgeGroup("");
        setIsRealFilter("");
        setIdStart(""); setIdEnd(""); setSearchTerm("");
        setPage(1);
    };

    const handleDeleteLead = async (id: number) => {
        if (!confirm("이 데이터를 정말 삭제하시겠습니까?")) return;
        
        const res = await deleteLeadAction(id);
        if (res.success) {
            alert("삭제되었습니다.");
            fetchData(page);
        } else {
            alert("삭제 실패: " + res.error);
        }
    };

    const handleRangeDelete = async () => {
        const start = parseInt(rangeDeleteStart);
        const end = parseInt(rangeDeleteEnd);

        if (isNaN(start) || isNaN(end)) {
            alert("시작 번호와 끝 번호를 정확히 입력해 주세요.");
            return;
        }

        if (!confirm(`${start}번부터 ${end}번까지의 데이터를 모두 삭제하시겠습니까?`)) return;

        setIsLoading(true);
        const res = await deleteLeadsByRangeAction(start, end);
        if (res.success) {
            alert("해당 범위의 데이터가 삭제되었습니다.");
            setRangeDeleteStart("");
            setRangeDeleteEnd("");
            getLeadsStatsAction().then(setStats);
            fetchData(1);
        } else {
            alert("삭제 실패: " + res.error);
        }
        setIsLoading(false);
    };

    const handleDeleteReal = async () => {
        if (!confirm("모든 자사몰 유입 고객 데이터(T)를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
        
        setIsLoading(true);
        const res = await deleteAllRealLeadsAction();
        if (res.success) {
            alert("자사몰 유입 고객 데이터가 모두 삭제되었습니다.");
            getLeadsStatsAction().then(setStats);
            fetchData(1);
        } else {
            alert("삭제 중 오류 발생: " + res.error);
        }
        setIsLoading(false);
    };

    // CSV 업로드
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        try {
            const text = await file.text();
            const batchId = `batch_${Date.now()}`;

            // 청크 분할 업로드 (브라우저에서 fetch로 처리)
            const lines = text.split("\n").filter(l => l.trim());
            const header = lines[0];
            const dataLines = lines.slice(1);
            const CHUNK_SIZE = 5000;
            let uploaded = 0;
            let skipped = 0;
            let failed = 0;

            for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
                const chunk = dataLines.slice(i, i + CHUNK_SIZE);
                const chunkText = [header, ...chunk].join("\n");

                const formData = new FormData();
                formData.append("csv", new Blob([chunkText], { type: "text/csv" }), "chunk.csv");
                formData.append("batchId", batchId);
                formData.append("isReal", String(uploadIsReal));
                formData.append("ignoreDuplicates", String(uploadIgnoreDuplicates));

                const res = await fetch("/api/leads/upload", {
                    method: "POST",
                    body: formData,
                });
                const result = await res.json();
                uploaded += result.uploaded || 0;
                skipped += result.skipped || 0;
                failed += result.failed || 0;

                const progress = Math.round(((i + chunk.length) / dataLines.length) * 100);
                setUploadProgress(progress);
            }

            setUploadResult({ uploaded, skipped, failed, total: dataLines.length });
            // 통계 갱신
            getLeadsStatsAction().then(setStats);
        } catch (err) {
            console.error("Upload error:", err);
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    const handleGenerateFake = async () => {
        if (!confirm("외부 유입 임의 데이터(1만건)를 생성하시겠습니까?")) return;
        setIsGenerating(true);
        try {
            const res = await generateFakeLeadsAction(10000);
            if (res.success) {
                alert(`외부 유입 데이터 ${res.inserted.toLocaleString()}건 생성 완료!`);
                setPage(1);
                fetchData(1);
                getLeadsStatsAction().then(setStats);
            } else {
                alert("생성 중 오류가 발생했습니다.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateReal = async () => {
        if (!confirm("자사몰 유입 고객 임의 데이터(1만건)를 생성하시겠습니까?\n(is_real = T 로 분류됩니다)")) return;
        setIsGenerating(true);
        try {
            const res = await generateRealLeadsAction(10000);
            if (res.success) {
                alert(`자사몰 유입 고객 ${res.inserted.toLocaleString()}건 생성 완료!`);
                setPage(1);
                fetchData(1);
                getLeadsStatsAction().then(setStats);
            } else {
                alert("생성 중 오류가 발생했습니다.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteFakeData = async () => {
        if (!confirm("주의! 모든 '외부 유입 고객(F)' 데이터가 삭제됩니다. 계속하시겠습니까?\n(자사몰 유입 고객 데이터는 유지됩니다)")) return;
        
        setIsLoading(true);
        try {
            const res = await deleteFakeLeadsAction();
            if (res.success) {
                alert("외부 유입 고객 데이터가 모두 삭제되었습니다.");
                fetchData();
                getLeadsStatsAction().then(setStats);
            } else {
                alert("삭제 실패");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMasterReset = async () => {
        if (!confirm("!!! 경고 !!!\n모든 데이터(자사몰+외부)가 삭제되고 번호표 기계가 1번으로 리셋됩니다.\n정말로 초기화하시겠습니까?")) return;
        
        setIsLoading(true);
        try {
            const res = await resetAllLeadsAction();
            if (res.success) {
                alert("데이터베이스가 완전히 초기화되었습니다. 이제 1번부터 시작합니다.");
                setPage(1);
                fetchData(1);
                getLeadsStatsAction().then(setStats);
            } else {
                alert("초기화 실패: " + res.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const DOWNLOAD_CHUNK_SIZE = 50000;
    const numChunks = Math.ceil(totalCount / DOWNLOAD_CHUNK_SIZE);

    // CSV 다운로드
    const handleDownload = async (chunkIndex = 0) => {
        setIsDownloading(true);
        try {
            const params = new URLSearchParams();
            if (sido) params.set("sido", sido);
            if (sigungu) params.set("sigungu", sigungu);
            if (dong) params.set("dong", dong);
            if (gender) params.set("gender", gender);
            if (ageGroup) params.set("ageGroup", ageGroup);
            if (isRealFilter) params.set("isReal", isRealFilter);
            if (idStart) params.set("idStart", idStart);
            if (idEnd) params.set("idEnd", idEnd);
            if (searchTerm) params.set("search", searchTerm);
            params.set("chunkIndex", String(chunkIndex));

            const res = await fetch(`/api/leads/download?${params.toString()}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const chunkLabel = numChunks > 1 ? `_part${chunkIndex + 1}` : "";
            a.download = `mono_shoes_leads_${new Date().toISOString().slice(0, 10)}${chunkLabel}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsDownloading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* 전체 화면 로딩 오버레이 */}
            {(isUploading || isGenerating) && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-sm">
                    <RefreshCw className="w-12 h-12 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold mb-2">
                        {isGenerating ? "테스트 데이터 생성 중..." : "데이터 업로드 중..."}
                    </h2>
                    {isUploading && (
                        <div className="w-64 mt-4">
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                                <div
                                    className="bg-white h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-center text-sm">{uploadProgress}% 완료</p>
                        </div>
                    )}
                    <p className="text-gray-400 text-sm mt-6">잠시만 기다려주세요. 브라우저를 닫거나 새로고침하지 마세요.</p>
                </div>
            )}

            {/* 헤더 */}
            <div className="mb-8">
                <h1 className="text-2xl font-black tracking-widest mb-1">고객 DB 관리</h1>
                <p className="text-sm text-gray-500">마케팅 리드 데이터 업로드 · 조회 · 다운로드</p>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "전체 DB", value: stats.total.toLocaleString(), icon: Database, color: "text-black" },
                    { label: "자사몰 유입 고객(T)", value: stats.realCount.toLocaleString(), icon: ShieldCheck, color: "text-green-600" },
                    { label: "외부 유입 고객(F)", value: stats.fakeCount.toLocaleString(), icon: ShieldAlert, color: "text-orange-500" },
                    { label: "조회 결과", value: totalCount > 0 ? totalCount.toLocaleString() : "-", icon: Filter, color: "text-purple-600" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                        </div>
                        <p className="text-2xl font-black">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* 업로드/생성 패널 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col h-full">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5" /> 데이터 추가
                    </h2>
                    
                    <div className="space-y-2 mb-4">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={uploadIsReal} 
                                onChange={e => setUploadIsReal(e.target.checked)}
                                className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black"
                            />
                            업로드하는 데이터를 '자사몰 유입 고객(T)'으로 분류
                            <span className="ml-1 text-[10px] font-normal text-gray-400">(체크 해제 시 외부 유입(F)으로 분류)</span>
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">중복 데이터 처리 (전화번호 기준)</p>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="duplicateAction"
                                        checked={uploadIgnoreDuplicates === true} 
                                        onChange={() => setUploadIgnoreDuplicates(true)}
                                        className="w-3.5 h-3.5 text-black border-gray-300 focus:ring-black"
                                    />
                                    건너뛰기 (안전)
                                </label>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="duplicateAction"
                                        checked={uploadIgnoreDuplicates === false} 
                                        onChange={() => setUploadIgnoreDuplicates(false)}
                                        className="w-3.5 h-3.5 text-black border-gray-300 focus:ring-black"
                                    />
                                    덮어쓰기 (갱신)
                                </label>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        <strong>서식:</strong> 순번, 연락처, 이름, 생년월일, 주민뒷자리시작번호, 주소, 비고(선택)<br />
                        * 비고 란에 T 또는 F 입력 시 개별 설정 가능<br />
                        * 대용량 파일은 5,000건씩 자동 분할 처리됩니다.
                    </p>

                    <label className="block w-full cursor-pointer mb-4">
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isUploading ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-black"}`}>
                            {isUploading ? (
                                <div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div
                                            className="bg-black h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm font-bold">{uploadProgress}% 업로드 중...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm font-medium">CSV 파일 선택</p>
                                    <p className="text-xs text-gray-400 mt-1">클릭하여 파일 선택</p>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-4">
                            {/* 1. 데이터 추가 그룹 — 마스터 전용 */}
                        {isMaster && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">데이터 생성</p>
                            <button
                                onClick={handleGenerateFake}
                                disabled={isGenerating || isUploading}
                                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Database className="w-4 h-4" />
                                외부 유입 고객 임의 생성(1만건)
                            </button>
                            <button
                                onClick={handleGenerateReal}
                                disabled={isGenerating || isUploading}
                                className="w-full py-2.5 bg-gray-800 hover:bg-black text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Database className="w-4 h-4" />
                                자사몰 유입 고객 임의 생성(1만건)
                            </button>
                        </div>
                        )}

                        {/* 2. 데이터 관리 (위험 구역) — 마스터 전용 */}
                        {isMaster && (
                        <div className="p-4 bg-white border-2 border-red-500 rounded-xl space-y-4">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5" /> 데이터 관리 및 위험 작업
                            </p>
                            
                            <div className="space-y-3">
                                {/* 1번: 임의 번호 범위 삭제 */}
                                <div className="p-3 bg-white border border-red-200 rounded-lg">
                                    <p className="text-[10px] font-bold text-red-500 mb-2 flex items-center gap-1">
                                        <span className="w-4 h-4 flex items-center justify-center bg-red-500 text-white rounded-full text-[9px]">1</span>
                                        임의 번호 범위 삭제
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="number" 
                                            placeholder="시작ID" 
                                            value={rangeDeleteStart}
                                            onChange={e => setRangeDeleteStart(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-red-100 rounded focus:outline-none focus:border-red-400"
                                        />
                                        <span className="text-red-200">~</span>
                                        <input 
                                            type="number" 
                                            placeholder="끝ID" 
                                            value={rangeDeleteEnd}
                                            onChange={e => setRangeDeleteEnd(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-red-100 rounded focus:outline-none focus:border-red-400"
                                        />
                                        <button
                                            onClick={handleRangeDelete}
                                            disabled={isLoading}
                                            className="px-4 py-1.5 bg-white border border-red-500 text-red-600 text-xs font-bold rounded hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>

                                {/* 2번: 테스트 데이터(F) 전체 삭제 */}
                                <button
                                    onClick={handleDeleteFakeData}
                                    disabled={isGenerating || isUploading || isLoading}
                                    className="w-full py-2.5 bg-white border border-red-500 text-red-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 hover:bg-red-50 disabled:opacity-50"
                                >
                                    <span className="w-4 h-4 flex items-center justify-center bg-red-500 text-white rounded-full text-[9px]">2</span>
                                    외부 유입 고객(F) 전체 삭제
                                </button>

                                {/* 3번: 실제 고객 데이터(T) 전체 삭제 */}
                                <button
                                    onClick={handleDeleteReal}
                                    disabled={isGenerating || isUploading || isLoading}
                                    className="w-full py-2.5 bg-white border border-red-500 text-red-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 hover:bg-red-50 disabled:opacity-50"
                                >
                                    <span className="w-4 h-4 flex items-center justify-center bg-red-500 text-white rounded-full text-[9px]">3</span>
                                    자사몰 유입 고객(T) 전체 삭제
                                </button>

                                {/* 4번: DB 전체 초기화 (번호 리셋) */}
                                <div className="pt-2 border-t border-red-100">
                                    <button
                                        onClick={handleMasterReset}
                                        disabled={isGenerating || isUploading || isLoading}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-red-200"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span className="w-5 h-5 flex items-center justify-center bg-white text-red-600 rounded-full text-[10px] font-bold">4</span>
                                        DB 전체 초기화 (번호 리셋)
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}

                        {uploadResult && (
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                                <p className="text-xs font-bold text-green-700">업로드 결과</p>
                                <p className="text-[10px] text-green-600 mt-1">
                                    성공 {uploadResult.uploaded.toLocaleString()}건 / 
                                    중복(제외) {uploadResult.skipped.toLocaleString()}건 / 
                                    실패 {uploadResult.failed.toLocaleString()}건
                                </p>
                            </div>
                        )}
                    </div>

                </div>

                {/* 필터 패널 */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Filter className="w-5 h-5" /> 필터 설정
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        {/* 지역 필터 */}
                        <select value={sido} onChange={e => setSido(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black">
                            <option value="">시/도 전체</option>
                            {sidoList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select value={sigungu} onChange={e => setSigungu(e.target.value)} disabled={!sido} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black disabled:opacity-50">
                            <option value="">시/군/구 전체</option>
                            {sigunguList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <input
                            type="text"
                            placeholder="읍/면/동 직접 입력"
                            value={dong}
                            onChange={e => setDong(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />

                        {/* 성별 필터 */}
                        <select value={gender} onChange={e => setGender(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black">
                            <option value="">전체 성별</option>
                            <option value="M">남성</option>
                            <option value="F">여성</option>
                        </select>

                        {/* 진위 여부 필터 */}
                        <select value={isRealFilter} onChange={e => setIsRealFilter(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black">
                            <option value="">데이터 종류 전체</option>
                            <option value="T">자사몰 유입 고객 (T)</option>
                            <option value="F">외부 유입 고객 (F)</option>
                        </select>

                        {/* 나이대 필터 */}
                        <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black">
                            {AGE_GROUPS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>

                        {/* 이름/전화 검색 */}
                        <input
                            type="text"
                            placeholder="이름 또는 전화번호"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                    </div>

                    {/* 순번 구간 */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="number"
                            placeholder="순번 시작 (예: 1)"
                            value={idStart}
                            onChange={e => setIdStart(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                        <span className="flex items-center text-gray-400">~</span>
                        <input
                            type="number"
                            placeholder="순번 종료 (예: 10000)"
                            value={idEnd}
                            onChange={e => setIdEnd(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                            조회
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                            <X className="w-4 h-4" /> 초기화
                        </button>
                        <div className="flex flex-wrap gap-2">
                            {numChunks <= 1 ? (
                                <button
                                    onClick={() => handleDownload(0)}
                                    disabled={isDownloading || totalCount === 0}
                                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    CSV 다운로드
                                </button>
                            ) : (
                                <div className="flex flex-col gap-2 w-full">
                                    <p className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded">대용량 데이터 분할 다운로드 (5만건 단위)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from({ length: numChunks }).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleDownload(i)}
                                                disabled={isDownloading}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <Download className="w-3 h-3" />
                                                파트 {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 데이터 테이블 */}
            {leads.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <p className="text-sm font-bold">
                            조회 결과: <span className="text-blue-600">{totalCount.toLocaleString()}건</span>
                            <span className="text-gray-400 font-normal ml-2">
                                (페이지 {page}/{totalPages})
                            </span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setPage(p => p - 1); fetchData(page - 1); }}
                                disabled={page <= 1}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                            <button
                                onClick={() => { setPage(p => p + 1); fetchData(page + 1); }}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {["순번", "종류", "연락처", "이름", "생년월일", "성별", "시/도", "시/군/구", "읍/면/동"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 text-xs">{lead.id}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {lead.is_real ? (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">T</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">F</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{lead.phone}</td>
                                        <td className="px-4 py-3 font-medium whitespace-nowrap">{lead.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{lead.birth_date || "-"}</td>
                                        <td className="px-4 py-3">
                                            {lead.gender === "M" ? (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">남</span>
                                            ) : lead.gender === "F" ? (
                                                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full font-medium">여</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">{lead.address_sido || "-"}</td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">{lead.address_sigungu || "-"}</td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">{lead.address_dong || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {leads.length === 0 && !isLoading && totalCount === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">조회된 데이터가 없습니다.</p>
                    <p className="text-sm mt-1">CSV 업로드 후 조회 버튼을 누르세요.</p>
                </div>
            )}
        </div>
    );
}
