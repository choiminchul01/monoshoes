"use server";

import { createClient } from "@supabase/supabase-js";
import { AdminPermissions, AdminRole } from "@/lib/useAdminPermissions";

// 관리자 전용 서비스 키를 사용하여 RLS를 우회하는 클라이언트 생성
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function saveAdminAction(formData: {
    id?: string;
    email: string;
    role: AdminRole;
    permissions: AdminPermissions;
    createdBy?: string;
}) {
    try {
        if (formData.id) {
            // 수정
            const { error } = await supabaseAdmin
                .from('admin_roles')
                .update({
                    role: formData.role,
                    permissions: formData.permissions,
                    updated_at: new Date().toISOString()
                })
                .eq('id', formData.id);
            if (error) throw error;
        } else {
            // 추가
            const { error } = await supabaseAdmin
                .from('admin_roles')
                .insert({
                    email: formData.email,
                    role: formData.role,
                    permissions: formData.permissions,
                    created_by: formData.createdBy
                });
            if (error) throw error;
        }
        return { success: true };
    } catch (error: any) {
        console.error('Error in saveAdminAction:', error);
        return { success: false, error: error.message, code: error.code };
    }
}

export async function deleteAdminAction(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from('admin_roles')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error in deleteAdminAction:', error);
        return { success: false, error: error.message };
    }
}
