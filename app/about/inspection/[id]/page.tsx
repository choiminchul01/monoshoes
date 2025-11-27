"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// 실제로는 데이터베이스에서 가져와야 하지만, 여기서는 하드코딩
const INSPECTION_DETAILS: Record<string, {
    id: string;
    date: string;
    customerName: string;
    images: string[];
    notes?: string;
}> = {
    "1": {
        id: "1",
        date: "2024.11.20",
        customerName: "김**님",
        images: [
            "https://placehold.co/1200x1200/png?text=Detail+1-1",
            "https://placehold.co/1200x1200/png?text=Detail+1-2",
            "https://placehold.co/1200x1200/png?text=Detail+1-3",
            "https://placehold.co/1200x1200/png?text=Detail+1-4",
        ],
        notes: "모든 검수 항목 통과. 제품 상태 양호.",
    },
    // 다른 ID들도 필요 시 추가
};

export default function InspectionDetailPage() {
    const params = useParams();
    const id = params.id as string;

    // 실제 데이터 또는 기본 데이터
    const inspection = INSPECTION_DETAILS[id] || {
        id,
        date: "2024.11.20",
        customerName: "고객님",
        images: [
            `https://placehold.co/1200x1200/png?text=Detail+${id}-1`,
            `https://placehold.co/1200x1200/png?text=Detail+${id}-2`,
            `https://placehold.co/1200x1200/png?text=Detail+${id}-3`,
            `https://placehold.co/1200x1200/png?text=Detail+${id}-4`,
        ],
        notes: "검수 완료",
    };

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
            <div className="mb-12">
                <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Quality Check Detail</p>
                <h1 className="text-3xl font-medium tracking-tight mb-2">출고 검수 상세</h1>
                <div className="flex gap-4 text-sm text-gray-600 mt-4">
                    <span>날짜: {inspection.date}</span>
                    <span>고객명: {inspection.customerName}</span>
                </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {inspection.images.map((image, index) => (
                    <div key={index} className="relative aspect-square w-full overflow-hidden bg-gray-100">
                        <Image
                            src={image}
                            alt={`Inspection detail ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Notes */}
            {inspection.notes && (
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-sm font-medium mb-2">검수 메모</h2>
                    <p className="text-sm text-gray-600">{inspection.notes}</p>
                </div>
            )}
        </div>
    );
}
