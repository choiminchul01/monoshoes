import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);

    // 필터 파라미터 파싱
    const sido = searchParams.get("sido") || "";
    const sigungu = searchParams.get("sigungu") || "";
    const dong = searchParams.get("dong") || "";
    const gender = searchParams.get("gender") || "";
    const ageGroup = searchParams.get("ageGroup") || "";
    const idStart = searchParams.get("idStart") ? parseInt(searchParams.get("idStart")!) : null;
    const idEnd = searchParams.get("idEnd") ? parseInt(searchParams.get("idEnd")!) : null;
    const search = searchParams.get("search") || "";

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .single();
    if (!adminUser) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // 쿼리 빌드
    let query = supabase
        .from("marketing_leads")
        .select("id, phone, name, birth_date, gender, address, address_sido, address_sigungu, address_dong, consent_date, created_at");

    if (sido) query = query.eq("address_sido", sido);
    if (sigungu) query = query.eq("address_sigungu", sigungu);
    if (dong) query = query.eq("address_dong", dong);
    if (gender) query = query.eq("gender", gender);
    if (idStart !== null) query = query.gte("id", idStart);
    if (idEnd !== null) query = query.lte("id", idEnd);
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

    // 나이대 필터
    if (ageGroup) {
        const currentYear = new Date().getFullYear();
        const ageMap: Record<string, [number, number]> = {
            "10s": [10, 19], "20s": [20, 29], "30s": [30, 39],
            "40s": [40, 49], "50s": [50, 59], "60s": [60, 69], "70s+": [70, 120],
        };
        const range = ageMap[ageGroup];
        if (range) {
            const maxBirth = `${currentYear - range[0]}-12-31`;
            const minBirth = `${currentYear - range[1]}-01-01`;
            query = query.gte("birth_date", minBirth).lte("birth_date", maxBirth);
        }
    }

    const { data, error } = await query.order("id", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // CSV 생성
    const headers = ["순번", "연락처", "이름", "생년월일", "성별", "주소", "시/도", "시/군/구", "읍/면/동", "동의일자", "등록일시"];
    const rows = (data || []).map((row: any) => [
        row.id,
        row.phone,
        row.name,
        row.birth_date || "",
        row.gender === "M" ? "남성" : row.gender === "F" ? "여성" : "미확인",
        row.address || "",
        row.address_sido || "",
        row.address_sigungu || "",
        row.address_dong || "",
        row.consent_date || "",
        row.created_at ? new Date(row.created_at).toLocaleDateString("ko-KR") : "",
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // BOM 포함 (엑셀 한글 깨짐 방지)
    const bom = "\uFEFF";
    const filename = `mono_shoes_leads_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(bom + csvContent, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
