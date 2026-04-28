"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Q&A 답변을 저장하는 서버 액션
 * service_role 권한을 사용하여 RLS 정책을 우회합니다.
 */
export async function submitAnswerAction(id: string, type: 'inquiry' | 'product_qna', answer: string) {
    const supabase = await createClient(); // 서버 클라이언트 생성

    const tableName = type === 'inquiry' ? 'general_qna' : 'product_qna';
    
    const { data, error } = await supabase
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
