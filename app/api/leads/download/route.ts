import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const CHUNK_SIZE = 50000; // 한 파일당 최대 5만 건으로 분할 다운로드 지원

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);

    // 관리자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminUser } = await supabase
        .from("admin_roles")
        .select("id")
        .eq("user_id", user.id)
        .single();
    if (!adminUser) return NextResponse.json({ error: "Admin only" }, { status: 403 });

    // 필터 파라미터
    const sido = searchParams.get("sido") || "";
    const sigungu = searchParams.get("sigungu") || "";
    const dong = searchParams.get("dong") || "";
    const gender = searchParams.get("gender") || "";
    const ageGroup = searchParams.get("ageGroup") || "";
    const isRealParam = searchParams.get("isReal") || "";
    const idStart = searchParams.get("idStart") ? parseInt(searchParams.get("idStart")!) : null;
    const idEnd = searchParams.get("idEnd") ? parseInt(searchParams.get("idEnd")!) : null;
    const search = searchParams.get("search") || "";

    // 청크 인덱스 (0부터 시작)
    const chunkIndex = parseInt(searchParams.get("chunkIndex") || "0");

    // 쿼리 빌드
    let query = supabase
        .from("marketing_leads")
        .select("id, seq, phone, name, birth_date, gender, address, address_sido, address_sigungu, address_dong, is_real, created_at", { count: "exact" });

    if (sido) query = query.eq("address_sido", sido);
    if (sigungu) query = query.eq("address_sigungu", sigungu);
    if (dong) query = query.eq("address_dong", dong);
    if (gender) query = query.eq("gender", gender);
    if (isRealParam === "T") query = query.eq("is_real", true);
    if (isRealParam === "F") query = query.eq("is_real", false);
    if (idStart !== null) query = query.gte("id", idStart);
    if (idEnd !== null) query = query.lte("id", idEnd);
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

    if (ageGroup) {
        const currentYear = new Date().getFullYear();
        const ageMap: Record<string, [number, number]> = {
            "10s": [10, 19], "20s": [20, 29], "30s": [30, 39],
            "40s": [40, 49], "50s": [50, 59], "60s": [60, 69], "70s+": [70, 120],
        };
        const range = ageMap[ageGroup];
        if (range) {
            query = query
                .gte("birth_date", `${currentYear - range[1]}-01-01`)
                .lte("birth_date", `${currentYear - range[0]}-12-31`);
        }
    }

    // 청크 범위 계산
    const from = chunkIndex * CHUNK_SIZE;
    const to = from + CHUNK_SIZE - 1;

    // Supabase 기본 제한(1000건)을 우회하기 위해 루프 사용
    let allData: any[] = [];
    let currentFrom = from;
    let finalCount = 0;

    while (currentFrom <= to) {
        const currentTo = Math.min(currentFrom + 999, to);
        const { data: chunkData, error: chunkError, count: chunkCount } = await query
            .order("id", { ascending: true })
            .range(currentFrom, currentTo);

        if (chunkError) return NextResponse.json({ error: chunkError.message }, { status: 500 });
        
        if (chunkData) allData = [...allData, ...chunkData];
        if (chunkCount !== null) finalCount = chunkCount;
        
        // 더 이상 가져올 데이터가 없거나 청크 끝에 도달하면 중단
        if (!chunkData || chunkData.length < 1000 || currentTo === to) break;
        currentFrom = currentTo + 1;
    }

    const data = allData;
    const totalCount = finalCount;
    const totalChunks = Math.ceil(totalCount / CHUNK_SIZE);

    // 최대 10만 건 제한
    if (totalCount > 100000 && chunkIndex === 0) {
        return NextResponse.json(
            { error: `조회 결과가 ${totalCount.toLocaleString()}건입니다. 필터를 좁혀서 10만 건 이하로 조회해 주세요.`, totalCount },
            { status: 413 }
        );
    }

    // CSV 생성
    const headers = ["순번", "DB순번", "연락처", "이름", "생년월일", "성별", "주소", "시/도", "시/군/구", "읍/면/동", "DB구분", "등록일시"];
    const rows = (data || []).map((row: any) => [
        row.seq || "",
        row.id,
        row.phone,
        row.name,
        row.birth_date || "",
        row.gender === "M" ? "남성" : row.gender === "F" ? "여성" : "미확인",
        row.address || "",
        row.address_sido || "",
        row.address_sigungu || "",
        row.address_dong || "",
        row.is_real ? "T" : "F",
        row.created_at ? new Date(row.created_at).toLocaleDateString("ko-KR") : "",
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // BOM 포함 (엑셀 한글 깨짐 방지)
    const bom = "\uFEFF";
    const dateStr = new Date().toISOString().slice(0, 10);
    const chunkLabel = totalChunks > 1
        ? `_${(from + 1).toLocaleString()}~${Math.min(to + 1, totalCount).toLocaleString()}`
        : "";
    const filename = `mono_leads_${dateStr}${chunkLabel}.csv`;

    return new NextResponse(bom + csvContent, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "X-Total-Count": String(totalCount),
            "X-Chunk-Index": String(chunkIndex),
            "X-Total-Chunks": String(totalChunks),
            "X-Chunk-Size": String(CHUNK_SIZE),
        },
    });
}
