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
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

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
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    console.log("=== [DEBUG] fetchLeadsAction ===");
    console.log("Session User ID:", session?.user?.id);

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 100;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("marketing_leads").select("*", { count: "exact" });

    if (filters.sido) query = query.eq("address_sido", filters.sido);
    if (filters.sigungu) query = query.eq("address_sigungu", filters.sigungu);
    if (filters.dong) query = query.ilike("address_dong", `%${filters.dong}%`);
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

    if (error) {
        console.error("=== [DEBUG] Query Error ===", error);
        return { success: false, error: error.message, data: [], count: 0 };
    }
    return { success: true, data: data || [], count: count || 0 };
}

// ============================================================
// 가짜 데이터 전체 삭제 (is_real = false)
// ============================================================
export async function deleteFakeLeadsAction() {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const { error } = await supabase
        .from("marketing_leads")
        .delete()
        .eq("is_real", false);

    if (error) {
        console.error("=== [deleteFakeLeadsAction] Error ===", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ============================================================
// 대한민국 실제 행정구역 데이터 (시/도 - 시/군/구 - 실제 동 이름 매핑)
// 가중치: 인구 비례 / dongs: 해당 지역의 대표적인 실제 동/읍/면 이름
const KOREA_ADMIN_DISTRICTS: Record<string, { weight: number, sigungus: Record<string, string[]> }> = {
    "서울": { 
        weight: 18, 
        sigungus: {
            "강남구": ["역삼동", "삼성동", "대치동", "논현동", "압구정동", "개포동"],
            "서초구": ["서초동", "반포동", "방배동", "양재동"],
            "송파구": ["잠실동", "가락동", "문정동", "방이동", "석촌동"],
            "마포구": ["합정동", "망원동", "연남동", "서교동", "공덕동"],
            "영등포구": ["여의도동", "당산동", "문래동", "신길동"],
            "강서구": ["화곡동", "가양동", "방화동", "등촌동"],
            "관악구": ["봉천동", "신림동", "남현동"],
            "노원구": ["상계동", "중계동", "하계동", "공릉동"],
            "은평구": ["불광동", "갈현동", "응암동", "진관동"],
            "강동구": ["천호동", "길동", "명일동", "암사동"]
        }
    },
    "경기": { 
        weight: 26, 
        sigungus: {
            "수원시 팔달구": ["인계동", "우만동", "화서동", "지동"],
            "수원시 영통구": ["영통동", "매탄동", "광교동"],
            "성남시 분당구": ["서현동", "정자동", "야탑동", "판교동", "이매동"],
            "용인시 수지구": ["풍덕천동", "죽전동", "상현동", "성복동"],
            "고양시 일산동구": ["장항동", "마두동", "백석동", "식사동"],
            "안양시 동안구": ["범계동", "평촌동", "관양동", "비산동"],
            "화성시": ["동탄동", "향남읍", "봉담읍", "남양읍"],
            "남양주시": ["다산동", "별내동", "와부읍", "진접읍"],
            "평택시": ["비전동", "안중읍", "포승읍", "고덕동"],
            "부천시": ["상동", "중동", "심곡동", "괴안동"]
        }
    },
    "전북": { 
        weight: 3.5, 
        sigungus: {
            "전주시 완산구": ["효자동", "삼천동", "평화동", "서신동", "중화산동"],
            "전주시 덕진구": ["송천동", "인후동", "덕진동", "우아동", "호성동"],
            "익산시": ["모현동", "영등동", "어양동", "신동", "남중동", "송학동"],
            "군산시": ["수송동", "나운동", "조촌동", "미룡동", "소룡동"],
            "정읍시": ["수성동", "연지동", "상동", "시기동"],
            "김제시": ["요촌동", "신풍동", "검산동"]
        }
    },
    "부산": { 
        weight: 6, 
        sigungus: {
            "해운대구": ["우동", "중동", "좌동", "반여동"],
            "부산진구": ["전포동", "부암동", "당감동", "양정동"],
            "남구": ["대연동", "용호동", "문현동"],
            "동래구": ["명륜동", "온천동", "사직동"]
        }
    },
    "인천": { 
        weight: 6, 
        sigungus: {
            "연수구": ["송도동", "옥련동", "동춘동"],
            "남동구": ["구월동", "간석동", "논현동"],
            "부평구": ["부평동", "산곡동", "삼산동"]
        }
    },
    "대구": { weight: 4.5, sigungus: { "수성구": ["범어동", "만촌동", "황금동"], "달서구": ["상인동", "월성동", "이곡동"] } },
    "광주": { weight: 2.7, sigungus: { "서구": ["치평동", "화정동", "풍암동"], "북구": ["용봉동", "운암동", "양산동"] } },
    "대전": { weight: 2.8, sigungus: { "유성구": ["봉명동", "상대동", "노은동"], "서구": ["둔산동", "탄방동", "월평동"] } },
    "울산": { weight: 2.1, sigungus: { "남구": ["삼산동", "달동", "옥동"], "중구": ["성남동", "복산동"] } },
    "강원": { weight: 3, sigungus: { "춘천시": ["퇴계동", "석사동", "후평동"], "원주시": ["단구동", "단계동", "무실동"], "강릉시": ["교동", "포남동", "송정동"] } },
    "충북": { weight: 3, sigungus: { "청주시 흥덕구": ["복대동", "가경동", "봉명동"], "청주시 상당구": ["용암동", "금천동"], "충주시": ["연수동", "호암동"] } },
    "충남": { weight: 4, sigungus: { "천안시 서북구": ["불당동", "두정동", "백석동"], "천안시 동남구": ["신부동", "청수동"], "아산시": ["배방읍", "탕정면", "온천동"] } },
    "전남": { weight: 3.5, sigungus: { "순천시": ["조례동", "연향동", "해룡면"], "여수시": ["학동", "여서동", "문수동"], "목포시": ["상동", "옥암동", "용당동"] } },
    "경북": { weight: 5, sigungus: { "포항시 남구": ["대잠동", "효자동", "지곡동"], "구미시": ["인동동", "상모사곡동", "형곡동"], "경주시": ["황성동", "동천동"] } },
    "제주": { weight: 1.3, sigungus: { "제주시": ["노형동", "연동", "아라동"], "서귀포시": ["동홍동", "서홍동"] } },
    "세종": { weight: 0.7, sigungus: { "세종특별자치시": ["도담동", "아름동", "종촌동", "고운동", "새롬동"] } }
};

export async function getLeadsRegionsAction(level: "sido" | "sigungu" | "dong", parent?: string) {
    if (level === "sido") {
        return Object.keys(KOREA_ADMIN_DISTRICTS).sort();
    }

    if (level === "sigungu" && parent && KOREA_ADMIN_DISTRICTS[parent]) {
        return Object.keys(KOREA_ADMIN_DISTRICTS[parent].sigungus).sort();
    }

    return [];
}



// 가짜 DB 임의 생성 (010 전용, 최대 10,000건)
// ============================================================
const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "류", "전"];
const GIVEN_NAMES = ["민준", "서연", "지호", "수아", "현우", "지우", "서준", "하은", "도윤", "지유", "예은", "민서", "준혁", "수빈", "재원", "나연", "태양", "유진", "성민", "보람"];

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

    // 가중치 기반 시/도 선택
    const sidos = Object.keys(KOREA_ADMIN_DISTRICTS);
    const totalWeight = Object.values(KOREA_ADMIN_DISTRICTS).reduce((sum, d) => sum + d.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let selectedSido = sidos[0];
    
    for (const s of sidos) {
        randomWeight -= KOREA_ADMIN_DISTRICTS[s].weight;
        if (randomWeight <= 0) {
            selectedSido = s;
            break;
        }
    }

    // 해당 시/도에서 무작위 시/군/구 선택
    const sigungusMap = KOREA_ADMIN_DISTRICTS[selectedSido].sigungus;
    const sigunguKeys = Object.keys(sigungusMap);
    const selectedSigungu = sigunguKeys[randomInt(0, sigunguKeys.length - 1)];

    // 해당 시/군/구에서 실제 동 이름 선택
    const dongs = sigungusMap[selectedSigungu];
    const selectedDong = dongs[randomInt(0, dongs.length - 1)];

    return {
        seq: null,
        phone,
        name,
        birth_date,
        gender,
        gender_code: genderCode,
        address: `${selectedSido} ${selectedSigungu} ${selectedDong}`,
        address_sido: selectedSido,
        address_sigungu: selectedSigungu,
        address_dong: selectedDong,
        is_real: false,
        batch_id: batchId,
    };
}

export async function generateFakeLeadsAction(count: number) {
    // 최대 10,000건 제한
    const safeCount = Math.min(Math.max(count, 1), 10000);
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
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
