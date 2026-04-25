"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// ============================================================
// 성별 자동 판별 (주민번호 뒷자리 시작번호)
// ============================================================
function determineGender(genderCode: string): string {
    const code = String(genderCode).trim();
    if (code === "1" || code === "3") return "M";
    if (code === "2" || code === "4") return "F";
    return "U";
}

// ============================================================
// 주소 파싱 (시/도, 시군구, 동 분리)
// ============================================================
function parseAddress(address: string) {
    if (!address || typeof address !== "string") {
        return { address_sido: null, address_sigungu: null, address_dong: null };
    }
    const parts = address.trim().split(/\s+/);
    return {
        address_sido: parts[0] || null,
        address_sigungu: parts[1] || null,
        address_dong: parts[2] || null,
    };
}

// ============================================================
// 생년월일 + 주민번호 통합 파싱
// 입력: "610802-1526218" 또는 "610802" 또는 "19610802"
// ============================================================
function parseBirthAndGender(raw: string): { birthDate: string | null; gender: string } {
    const cleaned = raw.trim();

    // 주민번호 형식 "YYMMDD-N..." 또는 "YYMMDDNNNNNNN"
    const hyphenIdx = cleaned.indexOf("-");
    if (hyphenIdx === 6) {
        const front = cleaned.slice(0, 6);
        const backFirst = cleaned.slice(7, 8);
        const yy = parseInt(front.slice(0, 2));
        const year = yy <= 24 ? `20${String(yy).padStart(2, "0")}` : `19${String(yy).padStart(2, "0")}`;
        const birthDate = `${year}-${front.slice(2, 4)}-${front.slice(4, 6)}`;
        return { birthDate, gender: determineGender(backFirst) };
    }

    // 순수 생년월일 8자리 "19610802"
    const digits = cleaned.replace(/[-./]/g, "");
    if (digits.length === 8) {
        return {
            birthDate: `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`,
            gender: "U",
        };
    }
    // 6자리 YYMMDD
    if (digits.length === 6) {
        const yy = parseInt(digits.slice(0, 2));
        const year = yy <= 24 ? `20${String(yy).padStart(2, "0")}` : `19${String(yy).padStart(2, "0")}`;
        return {
            birthDate: `${year}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`,
            gender: "U",
        };
    }
    return { birthDate: null, gender: "U" };
}

// parseLeadRow은 upload/route.ts에서 직접 정의 (use server 파일에서 export 불가)




// ============================================================
// 통계 대시보드 (실제/가짜 건수 포함)
// ============================================================
export async function getLeadsStatsAction() {
    const supabase = createServerActionClient({ cookies });

    const [totalRes, maleRes, femaleRes, realRes, fakeRes, batchRes] = await Promise.all([
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }),
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }).eq("gender", "M"),
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }).eq("gender", "F"),
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }).eq("is_real", true),
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }).eq("is_real", false),
        supabase.from("marketing_leads").select("batch_id, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    return {
        total: totalRes.count || 0,
        male: maleRes.count || 0,
        female: femaleRes.count || 0,
        realCount: realRes.count || 0,
        fakeCount: fakeRes.count || 0,
        recentBatches: batchRes.data || [],
    };
}

// ============================================================
// 서버사이드 페이지네이션 조회 (isReal 필터 추가)
// ============================================================
export async function fetchLeadsAction(filters: {
    sido?: string;
    sigungu?: string;
    dong?: string;
    gender?: string;
    ageGroup?: string;
    isReal?: "T" | "F" | "";
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

    let query = supabase.from("marketing_leads").select("*", { count: "exact" });

    if (filters.sido) query = query.eq("address_sido", filters.sido);
    if (filters.sigungu) query = query.eq("address_sigungu", filters.sigungu);
    if (filters.dong) query = query.eq("address_dong", filters.dong);
    if (filters.gender) query = query.eq("gender", filters.gender);
    if (filters.isReal === "T") query = query.eq("is_real", true);
    if (filters.isReal === "F") query = query.eq("is_real", false);

    if (filters.ageGroup) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const ageMap: Record<string, [number, number]> = {
            "10s": [10, 19], "20s": [20, 29], "30s": [30, 39],
            "40s": [40, 49], "50s": [50, 59], "60s": [60, 69], "70s+": [70, 120],
        };
        const range = ageMap[filters.ageGroup];
        if (range) {
            const maxBirth = `${currentYear - range[0]}-12-31`;
            const minBirth = `${currentYear - range[1]}-01-01`;
            query = query.gte("birth_date", minBirth).lte("birth_date", maxBirth);
        }
    }

    if (filters.idStart !== undefined) query = query.gte("id", filters.idStart);
    if (filters.idEnd !== undefined) query = query.lte("id", filters.idEnd);
    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query.order("id", { ascending: true }).range(from, to);

    if (error) return { success: false, error: error.message, data: [], count: 0 };
    return { success: true, data: data || [], count: count || 0 };
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
    return unique as string[];
}

// ============================================================
// 가짜 DB 임의 생성 (010 전용, 최대 10,000건)
// ============================================================
const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "류", "전"];
const GIVEN_NAMES = ["민준", "서연", "지호", "수아", "현우", "지우", "서준", "하은", "도윤", "지유", "예은", "민서", "준혁", "수빈", "재원", "나연", "태양", "유진", "성민", "보람"];
const REGIONS = [
    { sido: "서울", sigungu: "강남구", dong: "역삼동" },
    { sido: "서울", sigungu: "마포구", dong: "합정동" },
    { sido: "서울", sigungu: "송파구", dong: "잠실동" },
    { sido: "부산", sigungu: "해운대구", dong: "우동" },
    { sido: "부산", sigungu: "부산진구", dong: "전포동" },
    { sido: "인천", sigungu: "남동구", dong: "구월동" },
    { sido: "대구", sigungu: "수성구", dong: "범어동" },
    { sido: "광주", sigungu: "서구", dong: "화정동" },
    { sido: "대전", sigungu: "유성구", dong: "봉명동" },
    { sido: "울산", sigungu: "남구", dong: "삼산동" },
    { sido: "경기", sigungu: "수원시", dong: "팔달구" },
    { sido: "경기", sigungu: "성남시", dong: "분당구" },
    { sido: "경기", sigungu: "고양시", dong: "일산동구" },
    { sido: "충북", sigungu: "청주시", dong: "흥덕구" },
    { sido: "충남", sigungu: "천안시", dong: "서북구" },
    { sido: "전북", sigungu: "전주시", dong: "완산구" },
    { sido: "전남", sigungu: "순천시", dong: "조례동" },
    { sido: "경북", sigungu: "포항시", dong: "남구" },
    { sido: "경남", sigungu: "창원시", dong: "성산구" },
    { sido: "제주", sigungu: "제주시", dong: "노형동" },
];

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n: number, len = 2) {
    return String(n).padStart(len, "0");
}

function generateFakeLead(batchId: string) {
    const surname = SURNAMES[randomInt(0, SURNAMES.length - 1)];
    const given = GIVEN_NAMES[randomInt(0, GIVEN_NAMES.length - 1)];
    const name = surname + given;

    // 010 전용
    const phone = `010${pad(randomInt(0, 9999), 4)}${pad(randomInt(0, 9999), 4)}`;

    // 생년월일: 1940~2005
    const birthYear = randomInt(1940, 2005);
    const birthMonth = randomInt(1, 12);
    const birthDay = randomInt(1, 28);
    const birth_date = `${birthYear}-${pad(birthMonth)}-${pad(birthDay)}`;

    // 성별 (1=남/1900년대, 2=여/1900년대, 3=남/2000년대, 4=여/2000년대)
    const isMale = Math.random() > 0.5;
    const is2000s = birthYear >= 2000;
    const genderCode = is2000s ? (isMale ? "3" : "4") : (isMale ? "1" : "2");
    const gender = isMale ? "M" : "F";

    const region = REGIONS[randomInt(0, REGIONS.length - 1)];

    return {
        seq: null,
        phone,
        name,
        birth_date,
        gender,
        gender_code: genderCode,
        address: `${region.sido} ${region.sigungu} ${region.dong}`,
        address_sido: region.sido,
        address_sigungu: region.sigungu,
        address_dong: region.dong,
        is_real: false,
        batch_id: batchId,
    };
}

export async function generateFakeLeadsAction(count: number) {
    // 최대 10,000건 제한
    const safeCount = Math.min(Math.max(count, 1), 10000);
    const supabase = createServerActionClient({ cookies });
    const batchId = `fake_${Date.now()}`;
    const BATCH_SIZE = 1000;

    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < safeCount; i += BATCH_SIZE) {
        const chunk = Array.from({ length: Math.min(BATCH_SIZE, safeCount - i) }, () =>
            generateFakeLead(batchId)
        );

        const { error } = await supabase
            .from("marketing_leads")
            .upsert(chunk, { onConflict: "phone" });

        if (error) {
            console.error("Fake leads insert error:", error);
            failed += chunk.length;
        } else {
            inserted += chunk.length;
        }
    }

    return { success: true, inserted, failed, total: safeCount, batchId };
}
