/**
 * marketing_leads 테이블에 is_real + id 복합 인덱스 생성
 * 39만 건 이상의 is_real=true 조회 시 타임아웃을 방지합니다.
 * 
 * 실행: npx tsx scripts/create_index.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
    console.error("❌ 환경변수 NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
    process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
    console.log("🔧 marketing_leads 인덱스 생성 시작...");

    // is_real + id 복합 인덱스 (내림차순 정렬 포함)
    const { error: err1 } = await supabase.rpc("exec_sql", {
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketing_leads_is_real_id 
              ON marketing_leads (is_real, id DESC);`
    });

    if (err1) {
        console.log("⚠️ RPC 방식 실패, 직접 SQL 시도...", err1.message);
        // Supabase에서 RPC가 없을 수 있으므로 대안 메시지 출력
        console.log("\n📋 Supabase Dashboard > SQL Editor에서 아래 SQL을 직접 실행하세요:\n");
        console.log(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketing_leads_is_real_id`);
        console.log(`ON marketing_leads (is_real, id DESC);`);
        console.log(`\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketing_leads_is_real_phone`);
        console.log(`ON marketing_leads (is_real, phone);`);
        console.log(`\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketing_leads_phone`);
        console.log(`ON marketing_leads (phone);`);
    } else {
        console.log("✅ idx_marketing_leads_is_real_id 생성 완료");
    }

    console.log("\n완료!");
}

main();
