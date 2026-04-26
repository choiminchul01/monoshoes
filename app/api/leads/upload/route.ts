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

function parseLeadRow(cols: string[], defaultIsReal: boolean, batchId: string): object | null {
    try {
        const phone = (cols[1] || "").trim().replace(/[-\s]/g, "");
        const name = (cols[2] || "").trim();
        if (!phone || !name) return null;

        const { birthDate, gender } = parseBirthAndGender(cols[3] || "");
        const address = (cols[4] || "").trim();
        const remarkRaw = (cols[5] || "").trim().toUpperCase();
        const isReal = remarkRaw === "T" ? true : remarkRaw === "F" ? false : defaultIsReal;
        const seqRaw = parseInt(cols[0]);

        return {
            seq: isNaN(seqRaw) ? null : seqRaw,
            phone,
            name,
            birth_date: birthDate,
            gender,
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
        const file = formData.get("file") as File;
        const batchId = (formData.get("batchId") as string) || `batch_${Date.now()}`;
        const isRealParam = (formData.get("isReal") as string) === "true";

        if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

        const fileName = file.name.toLowerCase();
        let dataRows: string[][] = [];

        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            const hasHeader = raw.length > 0 && isNaN(Number(String(raw[0][0]).trim()));
            dataRows = (hasHeader ? raw.slice(1) : raw).map(r =>
                r.map((cell: any) => String(cell ?? "").trim())
            );
        } else {
            const text = await file.text();
            const lines = text.split("\n").filter(l => l.trim());
            const firstLine = lines[0] || "";
            const dataLines = /^\d/.test(firstLine.split(",")[0]) ? lines : lines.slice(1);
            dataRows = dataLines.map(line =>
                line.split(",").map(c => c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'))
            );
        }

        if (dataRows.length === 0) return NextResponse.json({ uploaded: 0, failed: 0, total: 0 });

        const rows = dataRows.map(cols => parseLeadRow(cols, isRealParam, batchId)).filter(Boolean);

        if (rows.length === 0) return NextResponse.json({ uploaded: 0, failed: dataRows.length, total: dataRows.length });

        const { error } = await supabase
            .from("marketing_leads")
            .upsert(rows as any[], { onConflict: "phone" });

        if (error) {
            console.error("Upload upsert error:", error);
            return NextResponse.json({ uploaded: 0, failed: rows.length, total: dataRows.length, error: error.message });
        }

        return NextResponse.json({ uploaded: rows.length, failed: dataRows.length - rows.length, total: dataRows.length });

    } catch (err: any) {
        console.error("Upload API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
