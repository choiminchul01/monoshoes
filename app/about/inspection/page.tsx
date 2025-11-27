"use client";

import { useState } from "react";
import { InspectionCard } from "@/components/inspection/InspectionCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 샘플 데이터
const INSPECTIONS = [
    {
        id: "1",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+1",
        date: "2024.11.20",
        customerName: "김**님",
    },
    {
        id: "2",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+2",
        date: "2024.11.19",
        customerName: "이**님",
    },
    {
        id: "3",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+3",
        date: "2024.11.18",
        customerName: "박**님",
    },
    {
        id: "4",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+4",
        date: "2024.11.17",
        customerName: "최**님",
    },
    {
        id: "5",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+5",
        date: "2024.11.16",
        customerName: "정**님",
    },
    {
        id: "6",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+6",
        date: "2024.11.15",
        customerName: "강**님",
    },
    {
        id: "7",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+7",
        date: "2024.11.14",
        customerName: "조**님",
    },
    {
        id: "8",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+8",
        date: "2024.11.13",
        customerName: "윤**님",
    },
    {
        id: "9",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+9",
        date: "2024.11.12",
        customerName: "장**님",
    },
    {
        id: "10",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+10",
        date: "2024.11.11",
        customerName: "임**님",
    },
    {
        id: "11",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+11",
        date: "2024.11.10",
        customerName: "한**님",
    },
    {
        id: "12",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+12",
        date: "2024.11.09",
        customerName: "오**님",
    },
    {
        id: "13",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+13",
        date: "2024.11.08",
        customerName: "서**님",
    },
    {
        id: "14",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+14",
        date: "2024.11.07",
        customerName: "신**님",
    },
    {
        id: "15",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+15",
        date: "2024.11.06",
        customerName: "권**님",
    },
    {
        id: "16",
        imageUrl: "https://placehold.co/600x600/png?text=Inspection+16",
        date: "2024.11.05",
        customerName: "황**님",
    },
];

const ITEMS_PER_PAGE = 12;

export default function InspectionPage() {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(INSPECTIONS.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = INSPECTIONS.slice(startIndex, endIndex);

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-12 text-center">
                <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Quality Check</p>
                <h1 className="text-3xl font-medium tracking-tight">출고 검수</h1>
                <p className="mt-4 text-sm text-gray-500">고객님께 전달되기 전 철저한 검수 과정을 거칩니다</p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-16 mb-12">
                {currentItems.map((inspection) => (
                    <InspectionCard
                        key={inspection.id}
                        id={inspection.id}
                        imageUrl={inspection.imageUrl}
                        date={inspection.date}
                        customerName={inspection.customerName}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                    {/* Previous Button */}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[40px] h-10 px-3 text-sm font-medium transition-colors ${currentPage === page
                                    ? "bg-black text-white"
                                    : "border border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    {/* Next Button */}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
