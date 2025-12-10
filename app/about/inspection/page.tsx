"use client";

import { useState, useEffect } from "react";
import { InspectionCard } from "@/components/inspection/InspectionCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const ITEMS_PER_PAGE = 12;

export default function InspectionPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInspections = async () => {
            try {
                const { data, error } = await supabase
                    .from("inspections")
                    .select("*")
                    .order("inspection_date", { ascending: false });

                if (error) throw error;
                setInspections(data || []);
            } catch (error) {
                console.error("Error fetching inspections:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInspections();
    }, []);

    const totalPages = Math.ceil(inspections.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = inspections.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center py-20 text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-10 text-center">
                <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Quality Check</p>
                <h1 className="text-3xl font-bold tracking-widest" style={{ fontFamily: "'S-Core Dream', sans-serif" }}>출고 검수</h1>
                <p className="mt-4 text-sm text-gray-500">고객님께 전달되기 전 철저한 검수 과정을 거칩니다</p>
            </div>

            {inspections.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">등록된 검수 내역이 없습니다.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-16 mb-12">
                        {currentItems.map((inspection) => (
                            <InspectionCard
                                key={inspection.id}
                                id={inspection.id}
                                imageUrl={inspection.image_url}
                                date={new Date(inspection.inspection_date).toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit"
                                }).replace(/\. /g, ".").replace(/\.$/, "")}
                                customerName={maskCustomerName(inspection.customer_name)}
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
                </>
            )}
        </div>
    );
}
