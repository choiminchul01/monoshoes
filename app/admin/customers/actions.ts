"use server";

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
        }).filter(u => u.phone); // 전화번호 있는 경우만 (매칭/표시용)

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

// 전체 가입 회원 수 조회 (전화번호 유무 무관, 카운트 전용)
export async function getMemberTotalCountAction() {
    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) return { count: 0 };
        return { count: users.length };
    } catch {
        return { count: 0 };
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
    // supabaseAdmin(service_role)으로 RLS 우회 - 관리자 서버 액션 전용
    const { page, pageSize, search, excludePhones } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // count: "exact"를 제거하여 타임아웃 방지 - 실제 데이터 100건만 조회
    let query = supabaseAdmin
        .from("marketing_leads")
        .select("id, name, phone, birth_date, gender, address_sido, address_sigungu, address_dong, created_at")
        .eq("is_real", true)
        .order("id", { ascending: false });

    if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (excludePhones && excludePhones.length > 0) {
        query = query.not("phone", "in", `(${excludePhones.join(",")})`);
    }

    const { data, error } = await query.range(from, to);

    if (error) {
        console.error("[fetchRealLeadsAction] Error:", error);
        return { success: false, error: error.message, data: [], count: 0 };
    }
    return { success: true, data: data || [], count: 0 };
}

// 자사몰 유입 고객 총 수 조회
export async function getRealLeadsCountAction() {
    // supabaseAdmin(service_role)으로 RLS 우회
    const { count, error } = await supabaseAdmin
        .from("marketing_leads")
        .select("id", { count: "exact", head: true })
        .eq("is_real", true);

    return { count: error ? 0 : (count || 0) };
}

// ============================================================
// 관리자(마스터) 전용: 회원 비밀번호 강제 변경
// ============================================================
export async function resetUserPasswordAction(userId: string, newPassword: string) {
    try {
        if (!newPassword || newPassword.length < 6) {
            return { success: false, error: "비밀번호는 최소 6자 이상이어야 합니다." };
        }

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            console.error("[resetUserPasswordAction] Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        console.error("[resetUserPasswordAction] Exception:", e);
        return { success: false, error: e.message || "알 수 없는 오류" };
    }
}

// 이하 호환성 유지 (다른 곳에서 참조 가능)
export { fetchAllMembersAction as fetchUnmatchedMembersAction };
