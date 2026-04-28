"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Q&A 답변을 저장하는 서버 액션
 * supabaseAdmin(service_role)을 사용하여 RLS 정책을 우회합니다.
 */
export async function submitAnswerAction(id: string, type: 'inquiry' | 'product_qna', answer: string) {
    const tableName = type === 'inquiry' ? 'general_qna' : 'product_qna';
    
    // supabaseAdmin을 사용하여 직접 업데이트
    const { data, error } = await supabaseAdmin
        .from(tableName)
        .update({
            answer: answer,
            is_answered: true,
            answered_at: new Date().toISOString()
        })
        .eq("id", id)
        .select();

    if (error) {
        console.error(`Error updating ${tableName}:`, error);
        return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
        return { success: false, error: "수정된 데이터가 없습니다. ID를 확인해주세요." };
    }

    revalidatePath("/admin/inquiries");
    return { success: true, data: data[0] };
}
