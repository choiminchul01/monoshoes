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
// 전체 가입 회원 조회 (검색 지원) - 고객 관리 상단 고정 표시용
// ============================================================
export async function fetchAllMembersAction(search?: string) {
    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) return { success: false, data: [], error: error.message };

        let members = users.map(user => {
            const meta = user.user_metadata || {};
            return {
                id: user.id,
                email: user.email || "",
                name: meta.full_name || meta.name || "이름 없음",
                phone: (meta.phone || "").replace(/\D/g, ""),
                created_at: user.created_at,
            };
        }).filter(u => u.phone); // 전화번호 없는 유저 제외

        if (search) {
            const s = search.toLowerCase();
            members = members.filter(u =>
                u.name.toLowerCase().includes(s) || u.phone.includes(s)
            );
        }

        return { success: true, data: members };
    } catch (e: any) {
        return { success: false, data: [], error: e.message };
    }
}

// ============================================================
// 자사몰 유입 고객 (marketing_leads, is_real=true) 서버사이드 페이징 조회
// excludePhones: 가입 회원 전화번호 - 상단에 이미 표시되므로 마케팅DB에서 제외
// ============================================================
export async function fetchRealLeadsAction(params: {
    page: number;
    pageSize: number;
    search?: string;
    excludePhones?: string[];
}) {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const { page, pageSize, search, excludePhones } = params;
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

    // 가입 회원 전화번호 제외 (이미 상단에 표시되므로 중복 방지)
    if (excludePhones && excludePhones.length > 0) {
        query = query.not("phone", "in", `(${excludePhones.join(",")})`);
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

// 이하 호환성 유지 (다른 곳에서 참조 가능)
export { fetchAllMembersAction as fetchUnmatchedMembersAction };
