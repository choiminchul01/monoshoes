"use server";

import { supabaseAdmin } from "@/lib/supabase";

/**
 * 모든 가입 사용자 목록을 가져오는 서버 액션
 * service_role 권한을 사용하여 auth.users 테이블의 정보를 안전하게 가져옵니다.
 */
export async function fetchAllUsersAction() {
    try {
        // Supabase Auth Admin API를 사용하여 전체 유저 목록 조회
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            console.error("Error listing users from auth:", error);
            return { success: false, error: error.message };
        }

        // 유저 정보 가공 (이름, 전화번호, 주소 등 메타데이터 추출)
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
        console.error("Unexpected error in fetchAllUsersAction:", error);
        return { success: false, error: error.message || "알 수 없는 오류가 발생했습니다." };
    }
}
