"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * 모든 가입 사용자 목록을 가져오는 서버 액션
 * service_role 권한을 사용하여 auth.users 테이블의 정보를 안전하게 가져옵니다.
 */
export async function fetchAllUsersAction() {
    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) return { success: false, error: error.message };

        const mappedUsers = users.map(user => {
            const metadata = user.user_metadata || {};
            return {
                id: user.id,
                email: user.email,
                name: metadata.full_name || metadata.name || "이름 없음",
                phone: metadata.phone || "",
                address: metadata.address || "",
                address_detail: metadata.address_detail || "",
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at
            };
        });

        return { success: true, users: mappedUsers };
    } catch (error: any) {
        return { success: false, error: error.message || "알 수 없는 오류" };
    }
}

// ============================================================
// 자사몰 유입 고객 (marketing_leads, is_real=true) 서버사이드 페이징 조회
// ============================================================
export async function fetchRealLeadsAction(params: {
    page: number;
    pageSize: number;
    search?: string;
}) {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const { page, pageSize, search } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from("marketing_leads")
        .select("id, name, phone, birth_date, gender, address_sido, address_sigungu, address_dong, created_at", { count: "exact" })
        .eq("is_real", true)
        .order("id", { ascending: false });

    if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
        return { success: false, error: error.message, data: [], count: 0 };
    }
    return { success: true, data: data || [], count: count || 0 };
}

// 자사몰 유입 고객 총 수 조회
export async function getRealLeadsCountAction() {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const { count, error } = await supabase
        .from("marketing_leads")
        .select("id", { count: "exact", head: true })
        .eq("is_real", true);

    return { count: error ? 0 : (count || 0) };
}

// ============================================================
// marketing_leads에 없는 가입 회원 조회 (전화번호 기준)
// 회원이 마케팅 DB에 미업로드된 경우 고객 목록에 포함시키기 위함
// ============================================================
export async function fetchUnmatchedMembersAction(search?: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerActionClient({ cookies: () => cookieStore });

        // 1. 전체 가입 회원 조회
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) return { success: false, data: [], error: usersError.message };

        const mappedUsers = users.map(user => {
            const meta = user.user_metadata || {};
            return {
                id: user.id,
                email: user.email || "",
                name: meta.full_name || meta.name || "이름 없음",
                phone: (meta.phone || "").replace(/\D/g, ""), // 숫자만 추출
                created_at: user.created_at,
            };
        }).filter(u => u.phone); // 전화번호 없는 유저 제외

        if (mappedUsers.length === 0) return { success: true, data: [] };

        // 2. marketing_leads에서 위 전화번호들이 존재하는지 확인
        const phones = mappedUsers.map(u => u.phone);
        const { data: existingLeads } = await supabase
            .from("marketing_leads")
            .select("phone")
            .eq("is_real", true)
            .in("phone", phones);

        const existingPhones = new Set((existingLeads || []).map((l: any) => l.phone));

        // 3. 마케팅 DB에 없는 회원만 필터
        let unmatched = mappedUsers.filter(u => !existingPhones.has(u.phone));

        // 4. 검색어 적용
        if (search) {
            const s = search.toLowerCase();
            unmatched = unmatched.filter(u =>
                u.name.toLowerCase().includes(s) || u.phone.includes(s)
            );
        }

        return { success: true, data: unmatched };
    } catch (e: any) {
        return { success: false, data: [], error: e.message };
    }
}
