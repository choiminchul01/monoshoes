import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// 성별 판별
function determineGender(code: string): string {
    const c = String(code).trim();
    if (c === "1" || c === "3") return "M";
    if (c === "2" || c === "4") return "F";
    return "U";
}

// 주소 파싱
function parseAddress(address: string) {
    const parts = (address || "").trim().split(/\s+/);
    return {
        address_sido: parts[0] || null,
        address_sigungu: parts[1] || null,
        address_dong: parts[2] || null,
    };
}

// 생년월일 파싱
function parseBirthDate(raw: string): string | null {
    const cleaned = (raw || "").replace(/[-./]/g, "").trim();
    if (cleaned.length === 8) {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }
    if (cleaned.length === 6) {
        const yy = parseInt(cleaned.slice(0, 2));
        const year = yy <= 24 ? `20${String(yy).padStart(2, "0")}` : `19${String(yy).padStart(2, "0")}`;
        return `${year}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
    }
    return null;
}

export async function POST(request: NextRequest) {
    const supabase = createRouteHandlerClient({ cookies });

    // 관리자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .single();
    if (!adminUser) return NextResponse.json({ error: "Admin only" }, { status: 403 });

    try {
        const formData = await request.formData();
        const csvFile = formData.get("csv") as File;
        const batchId = (formData.get("batchId") as string) || `batch_${Date.now()}`;

        if (!csvFile) {
            return NextResponse.json({ error: "No CSV file" }, { status: 400 });
        }

        const text = await csvFile.text();
        const lines = text.split("\n").filter(l => l.trim());

        // 첫 번째 줄 헤더 감지 (숫자로 시작하지 않으면 헤더)
        const firstLine = lines[0] || "";
        const dataLines = /^\d/.test(firstLine) ? lines : lines.slice(1);

        const rows = dataLines.map((line) => {
            const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
            if (cols.length < 3) return null;

            const phone = cols[1] || "";
            const name = cols[2] || "";
            if (!phone || !name) return null;

            const birthRaw = cols[3] || "";
            const genderCode = cols[4] || "";
            const address = cols.slice(5).join(",").trim();
            const { address_sido, address_sigungu, address_dong } = parseAddress(address);

            return {
                phone,
                name,
                birth_date: parseBirthDate(birthRaw),
                gender: determineGender(genderCode),
                gender_code: genderCode || null,
                address: address || null,
                address_sido,
                address_sigungu,
                address_dong,
                batch_id: batchId,
            };
        }).filter(Boolean);

        if (rows.length === 0) {
            return NextResponse.json({ uploaded: 0, failed: dataLines.length, total: dataLines.length });
        }

        const { error } = await supabase.from("marketing_leads").insert(rows);

        if (error) {
            console.error("Insert error:", error);
            return NextResponse.json({ uploaded: 0, failed: rows.length, total: rows.length, error: error.message });
        }

        return NextResponse.json({
            uploaded: rows.length,
            failed: dataLines.length - rows.length,
            total: dataLines.length,
        });

    } catch (err: any) {
        console.error("Upload API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
