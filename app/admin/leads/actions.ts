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
            "강동구": ["천호동", "길동", "명일동", "암사동"],
            "종로구": ["종로1가", "평창동", "혜화동"],
            "중구": ["명동", "을지로", "신당동"],
            "용산구": ["이태원동", "한남동", "용산동"],
            "성동구": ["성수동", "옥수동", "왕십리동"],
            "광진구": ["건대입구", "구의동", "자양동"],
            "동대문구": ["청량리동", "답십리동", "장안동"],
            "중랑구": ["망우동", "상봉동", "면목동"],
            "성북구": ["성북동", "길음동", "돈암동"],
            "강북구": ["수유동", "미아동", "번동"],
            "도봉구": ["쌍문동", "방학동", "창동"],
            "서대문구": ["신촌동", "연희동", "홍제동"],
            "양천구": ["목동", "신정동", "신월동"],
            "구로구": ["구로동", "신도림동", "개봉동"],
            "금천구": ["가산동", "독산동", "시흥동"],
            "동작구": ["노량진동", "사당동", "상도동"]
        }
    },
    "경기": {
        weight: 26,
        sigungus: {
            "수원시 장안구": ["파장동", "정자동", "조원동"],
            "수원시 권선구": ["권선동", "세류동", "곡선동"],
            "수원시 팔달구": ["인계동", "우만동", "화서동", "지동"],
            "수원시 영통구": ["영통동", "매탄동", "광교동"],
            "성남시 수정구": ["태평동", "수진동", "단대동"],
            "성남시 중원구": ["성남동", "상대원동", "하대원동"],
            "성남시 분당구": ["서현동", "정자동", "야탑동", "판교동", "이매동"],
            "용인시 처인구": ["김량장동", "역북동", "포곡읍"],
            "용인시 기흥구": ["신갈동", "구갈동", "보정동"],
            "용인시 수지구": ["풍덕천동", "죽전동", "상현동", "성복동"],
            "고양시 덕양구": ["화정동", "행신동", "원당동"],
            "고양시 일산동구": ["장항동", "마두동", "백석동", "식사동"],
            "고양시 일산서구": ["주엽동", "대화동", "탄현동"],
            "안양시 만안구": ["안양동", "석수동", "박달동"],
            "안양시 동안구": ["범계동", "평촌동", "관양동", "비산동"],
            "안산시 상록구": ["본오동", "사동", "일동"],
            "안산시 단원구": ["고잔동", "와동", "초지동"],
            "화성시": ["동탄동", "향남읍", "봉담읍", "남양읍"],
            "남양주시": ["다산동", "별내동", "와부읍", "진접읍", "화도읍"],
            "평택시": ["비전동", "안중읍", "포승읍", "고덕동"],
            "부천시": ["상동", "중동", "심곡동", "괴안동", "송내동"],
            "시흥시": ["정왕동", "배곧동", "능곡동", "은행동"],
            "김포시": ["구래동", "장기동", "운양동", "풍무동"],
            "파주시": ["운정동", "금촌동", "문산읍", "교하동"],
            "의정부시": ["의정부동", "호원동", "민락동"],
            "광주시": ["경안동", "오포읍", "초월읍"],
            "광명시": ["철산동", "하안동", "광명동"],
            "하남시": ["망월동", "미사동", "신장동"],
            "군포시": ["산본동", "금정동", "당동"],
            "오산시": ["오산동", "원동", "수청동"],
            "이천시": ["창전동", "부발읍", "장호원읍"],
            "양주시": ["옥정동", "덕정동", "백석읍"],
            "안성시": ["공도읍", "대덕면", "안성동"],
            "구리시": ["인창동", "수택동", "갈매동"],
            "포천시": ["소흘읍", "신북면", "포천동"],
            "의왕시": ["내손동", "포일동", "오전동"],
            "여주시": ["여흥동", "중앙동", "가남읍"],
            "양평군": ["양평읍", "용문면", "양서면"],
            "동두천시": ["생연동", "송내동", "지행동"],
            "과천시": ["중앙동", "별양동", "부림동"],
            "가평군": ["가평읍", "청평면", "설악면"],
            "연천군": ["연천읍", "전곡읍", "청산면"]
        }
    },
    "전북": {
        weight: 3.5,
        sigungus: {
            "전주시 완산구": ["효자동", "삼천동", "평화동", "서신동", "중화산동"],
            "전주시 덕진구": ["송천동", "인후동", "덕진동", "우아동", "호성동"],
            "익산시": ["모현동", "영등동", "어양동", "신동", "남중동", "송학동"],
            "군산시": ["수송동", "나운동", "조촌동", "미룡동", "소룡동"],
            "정읍시": ["수성동", "연지동", "상동", "시기동", "신태인읍"],
            "김제시": ["요촌동", "신풍동", "검산동", "만경읍"],
            "남원시": ["도통동", "향교동", "동충동", "운봉읍"],
            "완주군": ["봉동읍", "삼례읍", "이서면", "용진읍"],
            "고창군": ["고창읍", "무장면", "대산면", "흥덕면"],
            "부안군": ["부안읍", "줄포면", "변산면", "격포리"],
            "임실군": ["임실읍", "관촌면", "오수면"],
            "순창군": ["순창읍", "동계면", "복흥면"],
            "진안군": ["진안읍", "마령면", "부귀면"],
            "무주군": ["무주읍", "설천면", "안성면"],
            "장수군": ["장수읍", "장계면", "번암면"]
        }
    },
    "전남": {
        weight: 3.5,
        sigungus: {
            "순천시": ["조례동", "연향동", "해룡면", "왕조동"],
            "여수시": ["학동", "여서동", "문수동", "웅천동"],
            "목포시": ["상동", "옥암동", "용당동", "하당동"],
            "나주시": ["빛가람동", "남평읍", "영산동"],
            "광양시": ["중마동", "광양읍", "금호동"],
            "무안군": ["삼향읍(남악)", "일로읍", "무안읍"],
            "화순군": ["화순읍", "능주면", "동면"],
            "해남군": ["해남읍", "송지면", "황산면"],
            "고흥군": ["고흥읍", "도양읍", "포두면"],
            "장성군": ["장성읍", "삼계면", "황룡면"],
            "영암군": ["삼호읍", "영암읍", "신북면"],
            "완도군": ["완도읍", "금일읍", "노화읍"],
            "담양군": ["담양읍", "수북면", "창평면"],
            "보성군": ["보성읍", "벌교읍", "조성면"],
            "장흥군": ["장흥읍", "관산읍", "대덕읍"],
            "강진군": ["강진읍", "군동면", "칠량면"],
            "영광군": ["영광읍", "백수읍", "홍농읍"],
            "함평군": ["함평읍", "학교면", "해보면"],
            "진도군": ["진도읍", "군내면", "고군면"],
            "곡성군": ["곡성읍", "옥과면", "석곡면"],
            "구례군": ["구례읍", "마산면", "산동면"],
            "신안군": ["압해읍", "지도읍", "비금면"]
        }
    },
    "경북": {
        weight: 5,
        sigungus: {
            "포항시 북구": ["장량동", "환여동", "두호동", "흥해읍"],
            "포항시 남구": ["대잠동", "효자동", "지곡동", "오천읍"],
            "구미시": ["인동동", "상모사곡동", "형곡동", "선산읍"],
            "경산시": ["중방동", "하양읍", "진량읍", "압량읍"],
            "경주시": ["황성동", "동천동", "안강읍", "외동읍"],
            "안동시": ["옥동", "태화동", "용상동", "풍산읍"],
            "김천시": ["율곡동(혁신도시)", "대신동", "아포읍"],
            "영주시": ["가흥동", "휴천동", "풍기읍"],
            "상주시": ["남원동", "북문동", "함창읍"],
            "영천시": ["동부동", "중앙동", "금호읍"],
            "문경시": ["모전동", "점촌동", "문경읍"],
            "칠곡군": ["왜관읍", "석적읍", "북삼읍"],
            "의성군": ["의성읍", "안계면", "금성면"],
            "울진군": ["울진읍", "후포면", "죽변면"],
            "예천군": ["예천읍", "호명면(도청신도시)"],
            "청도군": ["청도읍", "화양읍", "풍각면"],
            "성주군": ["성주읍", "선남면", "초전면"],
            "영덕군": ["영덕읍", "강구면", "영해면"],
            "고령군": ["대가야읍", "다산면"],
            "봉화군": ["봉화읍", "춘양면"],
            "청송군": ["청송읍", "진보면"],
            "군위군": ["군위읍", "효령면"],
            "영양군": ["영양읍", "입암면"],
            "울릉군": ["울릉읍", "서면", "북면"]
        }
    },
    "경남": {
        weight: 6.5,
        sigungus: {
            "창원시 의창구": ["팔용동", "명곡동", "봉림동"],
            "창원시 성산구": ["상남동", "사파동", "반송동"],
            "창원시 마산합포구": ["월영동", "교방동", "현동"],
            "창원시 마산회원구": ["내서읍", "합성동", "양덕동"],
            "창원시 진해구": ["풍호동", "석동", "웅동동"],
            "김해시": ["내외동", "북부동", "장유동", "진영읍"],
            "진주시": ["평거동", "초장동", "충무공동(혁신도시)"],
            "양산시": ["물금읍", "동면", "양주동", "웅상"],
            "거제시": ["고현동", "옥포동", "상문동", "아주동"],
            "통영시": ["광도면", "북신동", "무전동"],
            "사천시": ["사천읍", "벌용동", "동서동"],
            "밀양시": ["삼문동", "내이동", "하남읍"],
            "거창군": ["거창읍", "가조면", "위천면"],
            "함안군": ["가야읍", "칠원읍", "군북면"],
            "창녕군": ["창녕읍", "남지읍", "대합면"],
            "고성군": ["고성읍", "회화면", "거류면"],
            "하동군": ["하동읍", "진교면", "금남면"],
            "합천군": ["합천읍", "초계면", "가야면"],
            "남해군": ["남해읍", "이동면", "삼동면"],
            "함양군": ["함양읍", "안의면", "마천면"],
            "산청군": ["산청읍", "신안면", "시천면"],
            "의령군": ["의령읍", "부림면", "칠곡면"]
        }
    },
    "부산": {
        weight: 6,
        sigungus: {
            "해운대구": ["우동", "중동", "좌동", "반여동", "재송동"],
            "부산진구": ["전포동", "부암동", "당감동", "양정동", "개금동", "가야동"],
            "사하구": ["하단동", "다대동", "괴정동", "신평동"],
            "동래구": ["명륜동", "온천동", "사직동", "안락동"],
            "남구": ["대연동", "용호동", "문현동", "우암동"],
            "북구": ["화명동", "구포동", "덕천동", "만덕동"],
            "금정구": ["구서동", "장전동", "부곡동", "남산동"],
            "수영구": ["남천동", "수영동", "망미동", "광안동"],
            "연제구": ["연산동", "거제동"],
            "사상구": ["주례동", "모라동", "학장동", "괘법동"],
            "영도구": ["동삼동", "영선동", "청학동"],
            "서구": ["서대신동", "동대신동", "암남동"],
            "동구": ["초량동", "수정동", "범일동"],
            "중구": ["남포동", "중앙동", "보수동"],
            "강서구": ["명지동", "녹산동", "대저동"],
            "기장군": ["기장읍", "정관읍", "일광읍"]
        }
    },
    "인천": {
        weight: 6,
        sigungus: {
            "연수구": ["송도동", "옥련동", "동춘동", "연수동"],
            "남동구": ["구월동", "간석동", "논현동", "만수동"],
            "부평구": ["부평동", "산곡동", "삼산동", "청천동", "십정동"],
            "서구": ["청라동", "검단동", "가정동", "신현원창동"],
            "미추홀구": ["주안동", "용현동", "학익동", "도화동"],
            "계양구": ["작전동", "계산동", "효성동"],
            "중구": ["영종동", "운서동", "신흥동", "연안동"],
            "동구": ["송림동", "화수동", "만석동"],
            "강화군": ["강화읍", "선원면", "길상면"],
            "옹진군": ["백령면", "영흥면", "북도면"]
        }
    },
    "대구": {
        weight: 4.5,
        sigungus: {
            "수성구": ["범어동", "만촌동", "황금동", "수성동", "지산동", "범물동"],
            "달서구": ["상인동", "월성동", "이곡동", "진천동", "성당동"],
            "북구": ["칠곡동", "복현동", "태전동", "산격동", "침산동"],
            "동구": ["신암동", "신천동", "율하동", "안심동", "방촌동"],
            "서구": ["평리동", "내당동", "비산동"],
            "남구": ["대명동", "봉덕동"],
            "중구": ["삼덕동", "동성로", "대봉동", "남산동"],
            "달성군": ["다사읍", "화원읍", "논공읍", "현풍읍", "유가읍"],
            "군위군": ["군위읍", "효령면", "부계면"]
        }
    },
    "광주": {
        weight: 2.7,
        sigungus: {
            "광산구": ["수완동", "첨단동", "신창동", "신가동", "우산동"],
            "북구": ["용봉동", "운암동", "양산동", "두암동", "일곡동"],
            "서구": ["치평동", "화정동", "풍암동", "상무동", "금호동"],
            "남구": ["봉선동", "백운동", "월산동", "진월동"],
            "동구": ["충장동", "산수동", "지산동", "계림동"]
        }
    },
    "대전": {
        weight: 2.8,
        sigungus: {
            "서구": ["둔산동", "탄방동", "월평동", "관저동", "도안동", "가수원동"],
            "유성구": ["봉명동", "상대동", "노은동", "관평동", "전민동", "반석동"],
            "중구": ["문화동", "태평동", "은행동", "대흥동", "산성동"],
            "동구": ["가양동", "용전동", "판암동", "대동"],
            "대덕구": ["송촌동", "중리동", "법동", "신탄진동"]
        }
    },
    "울산": {
        weight: 2.1,
        sigungus: {
            "남구": ["삼산동", "달동", "옥동", "신정동", "무거동"],
            "중구": ["성남동", "복산동", "태화동", "반구동", "우정동"],
            "북구": ["농소동", "효문동", "송정동", "강동동"],
            "동구": ["방어동", "전하동", "남목동", "일산동"],
            "울주군": ["범서읍", "온산읍", "언양읍", "청량읍"]
        }
    },
    "강원": {
        weight: 3,
        sigungus: {
            "원주시": ["단구동", "단계동", "무실동", "반곡관설동(혁신도시)", "명륜동", "기업도시"],
            "춘천시": ["퇴계동", "석사동", "후평동", "효자동", "동면"],
            "강릉시": ["교동", "포남동", "송정동", "내곡동", "주문진읍"],
            "동해시": ["천곡동", "북삼동", "동회동", "발한동"],
            "속초시": ["조양동", "교동", "청호동", "영랑동"],
            "삼척시": ["교동", "정라동", "남양동", "도계읍"],
            "태백시": ["황지동", "상장동", "장성동"],
            "홍천군": ["홍천읍", "남면", "서면"],
            "철원군": ["동송읍", "갈말읍", "김화읍"],
            "횡성군": ["횡성읍", "둔내면", "우천면"],
            "평창군": ["평창읍", "진부면", "대관령면"],
            "정선군": ["정선읍", "사북읍", "고한읍"],
            "영월군": ["영월읍", "주천면"],
            "인제군": ["인제읍", "원통리", "기린면"],
            "고성군": ["간성읍", "거진읍", "토성면"],
            "양양군": ["양양읍", "강현면", "손양면"],
            "화천군": ["화천읍", "사내면"],
            "양구군": ["양구읍", "남면"]
        }
    },
    "충북": {
        weight: 3,
        sigungus: {
            "청주시 흥덕구": ["복대동", "가경동", "봉명동", "강서동", "오송읍"],
            "청주시 청원구": ["오창읍", "율량동", "내수읍"],
            "청주시 상당구": ["용암동", "금천동", "용담동", "남일면"],
            "청주시 서원구": ["산남동", "분평동", "모충동", "수곡동"],
            "충주시": ["연수동", "호암동", "칠금동", "교현동"],
            "제천시": ["청전동", "용두동", "교동", "화산동"],
            "진천군": ["진천읍", "덕산읍(혁신도시)"],
            "음성군": ["금왕읍", "대소면", "맹동면(혁신도시)", "음성읍"],
            "옥천군": ["옥천읍", "이원면", "청산면"],
            "영동군": ["영동읍", "황간면"],
            "증평군": ["증평읍", "도안면"],
            "괴산군": ["괴산읍", "청천면"],
            "보은군": ["보은읍", "마로면"],
            "단양군": ["단양읍", "매포읍"]
        }
    },
    "충남": {
        weight: 4,
        sigungus: {
            "천안시 서북구": ["불당동", "두정동", "백석동", "쌍용동", "성정동", "직산읍"],
            "천안시 동남구": ["신부동", "청수동", "신방동", "원성동", "목천읍"],
            "아산시": ["배방읍", "탕정면", "온천동", "둔포면", "신창면"],
            "서산시": ["석남동", "동문동", "수석동", "대산읍"],
            "당진시": ["당진동", "송악읍", "신평면", "합덕읍"],
            "공주시": ["신관동", "월송동", "유구읍"],
            "논산시": ["취암동", "부창동", "연무읍", "강경읍"],
            "보령시": ["대천동", "웅천읍", "남포면"],
            "홍성군": ["홍성읍", "홍북읍(내포신도시)", "광천읍"],
            "예산군": ["예산읍", "삽교읍(내포신도시)", "덕산면"],
            "부여군": ["부여읍", "규암면", "홍산면"],
            "서천군": ["서천읍", "장항읍", "서면"],
            "태안군": ["태안읍", "안면읍", "소원면"],
            "금산군": ["금산읍", "추부면", "복수면"],
            "계룡시": ["엄사면", "금암동", "두마면"],
            "청양군": ["청양읍", "정산면"]
        }
    },
    "제주": {
        weight: 1.3,
        sigungus: {
            "제주시": ["노형동", "연동", "아라동", "이도동", "애월읍", "조천읍", "한림읍"],
            "서귀포시": ["동홍동", "서홍동", "대정읍", "남원읍", "성산읍", "중문동"]
        }
    },
    "세종": {
        weight: 0.7,
        sigungus: {
            "세종특별자치시": ["도담동", "아름동", "종촌동", "고운동", "새롬동", "다정동", "보람동", "조치원읍", "금남면"]
        }
    }
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
