import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";

// ── 파싱 헬퍼 (서버 액션 파일과 분리) ─────────────────────────
function determineGender(code: string): string {
    if (code === "1" || code === "3") return "M";
    if (code === "2" || code === "4") return "F";
    return "U";
}

function parseAddress(address: string) {
    const parts = (address || "").trim().split(/\s+/);
    return {
        address_sido: parts[0] || null,
        address_sigungu: parts[1] || null,
        address_dong: parts[2] || null,
    };
}

function parseBirthAndGender(raw: string): { birthDate: string | null; gender: string } {
    const cleaned = raw.trim();
    const hyphenIdx = cleaned.indexOf("-");
    if (hyphenIdx === 6) {
        const front = cleaned.slice(0, 6);
        const backFirst = cleaned.slice(7, 8);
        const yy = parseInt(front.slice(0, 2));
        const year = yy <= 24 ? `20${String(yy).padStart(2, "0")}` : `19${String(yy).padStart(2, "0")}`;
        return { birthDate: `${year}-${front.slice(2, 4)}-${front.slice(4, 6)}`, gender: determineGender(backFirst) };
    }
    const digits = cleaned.replace(/[-./]/g, "");
    if (digits.length === 8) return { birthDate: `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`, gender: "U" };
    if (digits.length === 6) {
        const yy = parseInt(digits.slice(0, 2));
        const year = yy <= 24 ? `20${String(yy).padStart(2, "0")}` : `19${String(yy).padStart(2, "0")}`;
        return { birthDate: `${year}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`, gender: "U" };
    }
    return { birthDate: null, gender: "U" };
}

// 헤더 매핑 헬퍼
function getHeaderMap(headers: string[]) {
    const map: Record<string, number> = {};
    headers.forEach((h, i) => {
        const clean = h.trim().replace(/\s+/g, "");
        if (clean.includes("연락처") || clean.includes("전화")) map.phone = i;
        if (clean.includes("이름") || clean.includes("성함")) map.name = i;
        if (clean.includes("생년월일") || clean.includes("생일")) map.birth = i;
        if (clean.includes("주소")) map.address = i;
        if (clean.includes("성별")) map.gender = i;
        if (clean.includes("비고") || clean.includes("DB구분")) map.remark = i;
    });
    return map;
}

function parseLeadRow(cols: string[], headerMap: Record<string, number>, defaultIsReal: boolean, batchId: string): object | null {
    try {
        const phoneIdx = headerMap.phone ?? 1;
        const nameIdx = headerMap.name ?? 2;
        const birthIdx = headerMap.birth ?? 3;
        const addressIdx = headerMap.address ?? 4;
        const remarkIdx = headerMap.remark ?? 5;

        const phone = (cols[phoneIdx] || "").trim().replace(/[-\s]/g, "");
        const name = (cols[nameIdx] || "").trim();
        if (!phone || !name || phone.length < 5) return null;

        const { birthDate, gender: parsedGender } = parseBirthAndGender(cols[birthIdx] || "");
        
        let finalGender = parsedGender;
        if (headerMap.gender !== undefined) {
            const gRaw = (cols[headerMap.gender] || "").trim();
            if (gRaw.includes("남")) finalGender = "M";
            else if (gRaw.includes("여")) finalGender = "F";
        }

        const address = (cols[addressIdx] || "").trim();
        const remarkRaw = (cols[remarkIdx] || "").trim().toUpperCase();
        const isReal = remarkRaw === "T" || remarkRaw.includes("실제") ? true : 
                       remarkRaw === "F" || remarkRaw.includes("테스트") || remarkRaw.includes("가짜") ? false : 
                       defaultIsReal;
        
        // id는 DB에서 자동 생성(IDENTITY)하므로 rows 객체에 포함하지 않음
        // 이렇게 해야 1, 2, 3... 순서대로 빈틈없이 들어감
        return {
            phone,
            name,
            birth_date: birthDate,
            gender: finalGender,
            address: address || null,
            ...parseAddress(address),
            is_real: isReal,
            batch_id: batchId,
        };
    } catch {
        return null;
    }
}

// ── API Route ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminUser } = await supabase
        .from("admin_roles").select("id").eq("user_id", user.id).single();
    if (!adminUser) return NextResponse.json({ error: "Admin only" }, { status: 403 });

    try {
        const formData = await request.formData();
        const file = (formData.get("csv") || formData.get("file")) as File;
        const batchId = (formData.get("batchId") as string) || `batch_${Date.now()}`;
        const isRealParam = (formData.get("isReal") as string) === "true";
        const ignoreDuplicates = (formData.get("ignoreDuplicates") as string) === "true";

        if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

        const fileName = file.name.toLowerCase();
        let headers: string[] = [];
        let dataRows: string[][] = [];

        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            
            if (raw.length > 0) {
                headers = raw[0].map((h: any) => String(h || ""));
                dataRows = raw.slice(1).map(r => r.map((cell: any) => String(cell ?? "").trim()));
            }
        } else {
            const text = await file.text();
            const lines = text.split("\n").filter(l => l.trim());
            if (lines.length > 0) {
                headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
                dataRows = lines.slice(1).map(line =>
                    line.split(",").map(c => c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'))
                );
            }
        }

        if (dataRows.length === 0) return NextResponse.json({ uploaded: 0, failed: 0, total: 0 });

        const headerMap = getHeaderMap(headers);
        const rows = dataRows.map(cols => parseLeadRow(cols, headerMap, isRealParam, batchId)).filter(Boolean);

        if (rows.length === 0) return NextResponse.json({ uploaded: 0, failed: dataRows.length, total: dataRows.length });

        const { data: upsertedData, error } = await supabase
            .from("marketing_leads")
            .upsert(rows as any[], { 
                onConflict: "phone",
                ignoreDuplicates: ignoreDuplicates
            })
            .select("id"); // 실제로 처리된 행의 ID만 가져옴

        if (error) {
            console.error("Upload upsert error:", error);
            return NextResponse.json({ uploaded: 0, failed: rows.length, total: dataRows.length, error: error.message });
        }

        const actualUploaded = upsertedData ? upsertedData.length : 0;
        const skipped = rows.length - actualUploaded;

        return NextResponse.json({ 
            uploaded: actualUploaded, 
            skipped: skipped,
            failed: dataRows.length - rows.length, 
            total: dataRows.length 
        });

    } catch (err: any) {
        console.error("Upload API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
