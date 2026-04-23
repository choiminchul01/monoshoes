"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// ============================================================
// 성별 자동 판별 (주민번호 뒷자리 시작번호)
// 1 = 남성 (1999년 이전), 2 = 여성 (1999년 이전)
// 3 = 남성 (2000년 이후), 4 = 여성 (2000년 이후)
// ============================================================
function determineGender(genderCode: string): string {
    const code = String(genderCode).trim();
    if (code === "1" || code === "3") return "M"; // 남성
    if (code === "2" || code === "4") return "F"; // 여성
    return "U"; // 미확인
}

// ============================================================
// 주소 파싱 (시/도, 시군구, 동 분리)
// ============================================================
function parseAddress(address: string): {
    address_sido: string;
    address_sigungu: string;
    address_dong: string;
} {
    if (!address || typeof address !== "string") {
        return { address_sido: "", address_sigungu: "", address_dong: "" };
    }

    const parts = address.trim().split(/\s+/);
    return {
        address_sido: parts[0] || "",
        address_sigungu: parts[1] || "",
        address_dong: parts[2] || "",
    };
}

// ============================================================
// CSV 행 파싱
// 서식: 순번 | 연락처 | 이름 | 생년월일 | 주민뒷자리시작번호 | 주소
// ============================================================
function parseCSVRow(line: string, index: number): object | null {
    try {
        const cols = line.split(",").map((c) => c.trim());
        if (cols.length < 4) return null;

        const phone = cols[1] || "";
        const name = cols[2] || "";
        const birthRaw = cols[3] || "";
        const genderCode = cols[4] || "";
        const address = cols.slice(5).join(",").trim() || "";

        if (!phone || !name) return null;

        // 생년월일 파싱 (YYYYMMDD → YYYY-MM-DD)
        let birthDate: string | null = null;
        const cleaned = birthRaw.replace(/[-./]/g, "");
        if (cleaned.length === 8) {
            birthDate = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
        } else if (cleaned.length === 6) {
            // 주민번호 앞자리 YYMMDD
            const yy = parseInt(cleaned.slice(0, 2));
            const year = yy >= 0 && yy <= 24 ? `20${String(yy).padStart(2, "0")}` : `19${String(yy).padStart(2, "0")}`;
            birthDate = `${year}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
        }

        const { address_sido, address_sigungu, address_dong } = parseAddress(address);
        const gender = determineGender(genderCode);

        return {
            phone,
            name,
            birth_date: birthDate,
            gender,
            gender_code: genderCode || null,
            address: address || null,
            address_sido: address_sido || null,
            address_sigungu: address_sigungu || null,
            address_dong: address_dong || null,
        };
    } catch {
        return null;
    }
}

// ============================================================
// 배치 업로드 (5,000건 청크)
// ============================================================
export async function uploadLeadsBatchAction(
    csvText: string,
    batchId: string,
    onProgress?: (uploaded: number, total: number) => void
) {
    const supabase = createServerActionClient({ cookies });

    const lines = csvText
        .split("\n")
        .filter((l) => l.trim())
        .slice(1); // 헤더 행 제거

    const CHUNK_SIZE = 5000;
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
        const chunk = lines.slice(i, i + CHUNK_SIZE);
        const rows = chunk
            .map((line, idx) => parseCSVRow(line, i + idx))
            .filter(Boolean)
            .map((row: any) => ({ ...row, batch_id: batchId }));

        if (rows.length === 0) continue;

        const { error } = await supabase
            .from("marketing_leads")
            .insert(rows);

        if (error) {
            console.error(`Chunk ${i / CHUNK_SIZE} 업로드 오류:`, error);
            failed += chunk.length;
        } else {
            uploaded += rows.length;
        }
    }

    return {
        success: true,
        uploaded,
        failed,
        total: lines.length,
    };
}

// ============================================================
// 서버사이드 페이지네이션 조회
// ============================================================
export async function fetchLeadsAction(filters: {
    sido?: string;
    sigungu?: string;
    dong?: string;
    gender?: string;       // M / F
    ageGroup?: string;     // "10s", "20s", ... "70s+"
    idStart?: number;
    idEnd?: number;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const supabase = createServerActionClient({ cookies });

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 100;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from("marketing_leads")
        .select("*", { count: "exact" });

    // 지역 필터
    if (filters.sido) query = query.eq("address_sido", filters.sido);
    if (filters.sigungu) query = query.eq("address_sigungu", filters.sigungu);
    if (filters.dong) query = query.eq("address_dong", filters.dong);

    // 성별 필터
    if (filters.gender) query = query.eq("gender", filters.gender);

    // 나이대 필터
    if (filters.ageGroup) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const ageMap: Record<string, [number, number]> = {
            "10s": [10, 19],
            "20s": [20, 29],
            "30s": [30, 39],
            "40s": [40, 49],
            "50s": [50, 59],
            "60s": [60, 69],
            "70s+": [70, 120],
        };
        const range = ageMap[filters.ageGroup];
        if (range) {
            const maxBirth = `${currentYear - range[0]}-12-31`;
            const minBirth = `${currentYear - range[1]}-01-01`;
            query = query.gte("birth_date", minBirth).lte("birth_date", maxBirth);
        }
    }

    // 순번 구간 필터
    if (filters.idStart !== undefined) query = query.gte("id", filters.idStart);
    if (filters.idEnd !== undefined) query = query.lte("id", filters.idEnd);

    // 이름/전화번호 검색
    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
        .order("id", { ascending: true })
        .range(from, to);

    if (error) {
        return { success: false, error: error.message, data: [], count: 0 };
    }

    return { success: true, data: data || [], count: count || 0 };
}

// ============================================================
// 통계 대시보드
// ============================================================
export async function getLeadsStatsAction() {
    const supabase = createServerActionClient({ cookies });

    const [totalRes, maleRes, femaleRes, batchRes] = await Promise.all([
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }),
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }).eq("gender", "M"),
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }).eq("gender", "F"),
        supabase.from("marketing_leads").select("batch_id, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    return {
        total: totalRes.count || 0,
        male: maleRes.count || 0,
        female: femaleRes.count || 0,
        recentBatches: batchRes.data || [],
    };
}

// ============================================================
// 지역 목록 조회 (필터 드롭다운용)
// ============================================================
export async function getLeadsRegionsAction(level: "sido" | "sigungu" | "dong", parent?: string) {
    const supabase = createServerActionClient({ cookies });

    const columnMap = { sido: "address_sido", sigungu: "address_sigungu", dong: "address_dong" };
    const col = columnMap[level];

    let query = supabase.from("marketing_leads").select(col).not(col, "is", null);

    if (level === "sigungu" && parent) query = query.eq("address_sido", parent);
    if (level === "dong" && parent) query = query.eq("address_sigungu", parent);

    const { data } = await query.limit(1000);

    const unique = [...new Set((data || []).map((r: any) => r[col]).filter(Boolean))].sort();
    return unique;
}
