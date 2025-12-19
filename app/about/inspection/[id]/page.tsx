"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

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
    image_urls: string[];
    inspection_date: string;
    customer_name: string;
};

export default function InspectionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

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

    // Get all images (use image_urls if available, fallback to image_url)
    const allImages = inspection?.image_urls?.length
        ? inspection.image_urls
        : inspection?.image_url
            ? [inspection.image_url]
            : [];

    const nextImage = () => {
        setCurrentImageIndex((prev) =>
            prev < allImages.length - 1 ? prev + 1 : 0
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev > 0 ? prev - 1 : allImages.length - 1
        );
    };

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

            {/* Main Image */}
            <div className="max-w-4xl mx-auto">
                {allImages.length > 0 && (
                    <div
                        className="relative bg-gray-50 rounded-xl overflow-hidden shadow-sm cursor-pointer"
                        onClick={() => setIsGalleryOpen(true)}
                    >
                        <div className="relative aspect-square w-full">
                            <Image
                                src={allImages[currentImageIndex]}
                                alt={`Inspection for ${inspection.customer_name}`}
                                fill
                                className="object-contain"
                            />
                        </div>

                        {/* Navigation Arrows */}
                        {allImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Image Counter */}
                        {allImages.length > 1 && (
                            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                                {currentImageIndex + 1} / {allImages.length}
                            </div>
                        )}
                    </div>
                )}

                {/* Thumbnail Gallery */}
                {allImages.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {allImages.map((url, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index
                                        ? "border-[#C41E3A] ring-2 ring-[#C41E3A]"
                                        : "border-gray-200 hover:border-gray-400"
                                    }`}
                            >
                                <Image
                                    src={url}
                                    alt={`Thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Gallery Modal */}
            <AnimatePresence>
                {isGalleryOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                        onClick={() => setIsGalleryOpen(false)}
                    >
                        <button
                            onClick={() => setIsGalleryOpen(false)}
                            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        <div className="relative w-full h-full flex items-center justify-center p-8">
                            <Image
                                src={allImages[currentImageIndex]}
                                alt={`Inspection ${currentImageIndex + 1}`}
                                fill
                                className="object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />

                            {allImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-4 p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                                    >
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-4 p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                                    >
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                </>
                            )}

                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white rounded-full">
                                {currentImageIndex + 1} / {allImages.length}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
