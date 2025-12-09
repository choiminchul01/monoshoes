"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

// 이름 마스킹 함수
function maskCustomerName(name: string): string {
    if (!name || name.length < 2) return name + "님";
    const first = name.charAt(0);
    const last = name.charAt(name.length - 1);
    const middleLength = name.length - 2;
    const middle = "*".repeat(Math.max(1, middleLength));
    return `${first}${middle}${last}님`;
}

type Inspection = {
    id: string;
    image_url: string;
    inspection_date: string;
    customer_name: string;
};

export default function InspectionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInspection = async () => {
            const { data, error } = await supabase
                .from("inspections")
                .select("*")
                .eq("id", id)
                .single();

            if (!error && data) {
                setInspection(data);
            }
            setLoading(false);
        };

        if (id) {
            fetchInspection();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center text-gray-400">
                Loading...
            </div>
        );
    }

    if (!inspection) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-500 mb-4">검수 정보를 찾을 수 없습니다.</p>
                <Link
                    href="/about/inspection"
                    className="inline-flex items-center gap-2 text-sm text-black font-bold hover:underline"
                >
                    <ChevronLeft className="w-4 h-4" />
                    목록으로 돌아가기
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Back Button */}
            <Link
                href="/about/inspection"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-8 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                목록으로 돌아가기
            </Link>

            {/* Header */}
            <div className="mb-10">
                <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Quality Check Detail</p>
                <h1 className="text-3xl font-bold tracking-widest mb-2">출고 검수 상세</h1>
                <div className="flex gap-4 text-sm text-gray-600 mt-4">
                    <span>날짜: {new Date(inspection.inspection_date).toLocaleDateString("ko-KR")}</span>
                    <span>고객명: {maskCustomerName(inspection.customer_name)}</span>
                </div>
            </div>

            {/* Image */}
            <div className="max-w-4xl mx-auto bg-gray-50 rounded-xl overflow-hidden shadow-sm">
                <div className="relative aspect-square w-full">
                    <Image
                        src={inspection.image_url}
                        alt={`Inspection for ${inspection.customer_name}`}
                        fill
                        className="object-contain"
                    />
                </div>
            </div>
        </div>
    );
}
