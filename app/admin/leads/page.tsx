"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Download, Filter, Users, TrendingUp, X, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchLeadsAction, getLeadsStatsAction, getLeadsRegionsAction } from "./actions";

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
};

type Stats = {
    total: number;
    male: number;
    female: number;
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
    const [stats, setStats] = useState<Stats>({ total: 0, male: 0, female: 0, recentBatches: [] });
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 100;

    // 필터 상태
    const [sido, setSido] = useState("");
    const [sigungu, setSigungu] = useState("");
    const [dong, setDong] = useState("");
    const [gender, setGender] = useState("");
    const [ageGroup, setAgeGroup] = useState("");
    const [idStart, setIdStart] = useState("");
    const [idEnd, setIdEnd] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // 지역 목록
    const [sidoList, setSidoList] = useState<string[]>([]);
    const [sigunguList, setSigunguList] = useState<string[]>([]);
    const [dongList, setDongList] = useState<string[]>([]);

    // UI 상태
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<{ uploaded: number; failed: number; total: number } | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

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
            setDongList([]);
        } else {
            setSigunguList([]);
            setSigungu("");
            setDong("");
            setDongList([]);
        }
    }, [sido]);

    // 시/군/구 변경 시 읍/면/동 로드
    useEffect(() => {
        if (sigungu) {
            getLeadsRegionsAction("dong", sigungu).then(setDongList);
            setDong("");
        } else {
            setDongList([]);
            setDong("");
        }
    }, [sigungu]);

    // 데이터 조회
    const fetchData = useCallback(async (p = 1) => {
        setIsLoading(true);
        const result = await fetchLeadsAction({
            sido: sido || undefined,
            sigungu: sigungu || undefined,
            dong: dong || undefined,
            gender: gender || undefined,
            ageGroup: ageGroup || undefined,
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
    }, [sido, sigungu, dong, gender, ageGroup, idStart, idEnd, searchTerm]);

    const handleSearch = () => {
        setPage(1);
        fetchData(1);
    };

    const handleReset = () => {
        setSido(""); setSigungu(""); setDong("");
        setGender(""); setAgeGroup("");
        setIdStart(""); setIdEnd(""); setSearchTerm("");
        setPage(1);
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
            let failed = 0;

            for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
                const chunk = dataLines.slice(i, i + CHUNK_SIZE);
                const chunkText = [header, ...chunk].join("\n");

                const formData = new FormData();
                formData.append("csv", new Blob([chunkText], { type: "text/csv" }), "chunk.csv");
                formData.append("batchId", batchId);

                const res = await fetch("/api/leads/upload", {
                    method: "POST",
                    body: formData,
                });
                const result = await res.json();
                uploaded += result.uploaded || 0;
                failed += result.failed || 0;

                const progress = Math.round(((i + chunk.length) / dataLines.length) * 100);
                setUploadProgress(progress);
            }

            setUploadResult({ uploaded, failed, total: dataLines.length });
            // 통계 갱신
            getLeadsStatsAction().then(setStats);
        } catch (err) {
            console.error("Upload error:", err);
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    // CSV 다운로드
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const params = new URLSearchParams();
            if (sido) params.set("sido", sido);
            if (sigungu) params.set("sigungu", sigungu);
            if (dong) params.set("dong", dong);
            if (gender) params.set("gender", gender);
            if (ageGroup) params.set("ageGroup", ageGroup);
            if (idStart) params.set("idStart", idStart);
            if (idEnd) params.set("idEnd", idEnd);
            if (searchTerm) params.set("search", searchTerm);

            const res = await fetch(`/api/leads/download?${params.toString()}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `mono_shoes_leads_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsDownloading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* 헤더 */}
            <div className="mb-8">
                <h1 className="text-2xl font-black tracking-widest mb-1">고객 DB 관리</h1>
                <p className="text-sm text-gray-500">마케팅 리드 데이터 업로드 · 조회 · 다운로드</p>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "전체 고객", value: stats.total.toLocaleString(), icon: Users, color: "text-blue-600" },
                    { label: "남성", value: stats.male.toLocaleString(), icon: TrendingUp, color: "text-blue-500" },
                    { label: "여성", value: stats.female.toLocaleString(), icon: TrendingUp, color: "text-pink-500" },
                    { label: "조회 결과", value: totalCount > 0 ? totalCount.toLocaleString() : "-", icon: Filter, color: "text-green-600" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                        </div>
                        <p className="text-2xl font-black">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* 업로드 패널 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5" /> CSV 업로드
                    </h2>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        <strong>서식:</strong> 순번, 연락처, 이름, 생년월일, 주민뒷자리시작번호, 주소<br />
                        5,000건씩 자동 분할 업로드됩니다.
                    </p>

                    <label className="block w-full cursor-pointer">
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
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>

                    {uploadResult && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                            <p className="font-bold text-green-700">업로드 완료!</p>
                            <p className="text-green-600">
                                성공 {uploadResult.uploaded.toLocaleString()}건 /
                                실패 {uploadResult.failed}건 /
                                전체 {uploadResult.total.toLocaleString()}건
                            </p>
                        </div>
                    )}
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

                        <select value={dong} onChange={e => setDong(e.target.value)} disabled={!sigungu} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black disabled:opacity-50">
                            <option value="">읍/면/동 전체</option>
                            {dongList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* 성별 필터 */}
                        <select value={gender} onChange={e => setGender(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black">
                            <option value="">전체 성별</option>
                            <option value="M">남성</option>
                            <option value="F">여성</option>
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
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading || totalCount === 0}
                            className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            CSV 다운로드
                        </button>
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
                                    {["순번", "연락처", "이름", "생년월일", "성별", "시/도", "시/군/구", "읍/면/동"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 text-xs">{lead.id}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{lead.phone}</td>
                                        <td className="px-4 py-3 font-medium">{lead.name}</td>
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
