"use client";

import { useState, useEffect } from 'react';
import { fetchBrandLogosAction } from '@/app/admin/settings/actions';
import Image from 'next/image';

interface BrandLogo {
    name: string;
    imageUrl: string | null;
    order: number;
}

// 기본 신발 브랜드 목록 (DB 데이터 없을 때 폴백)
const defaultBrands = [
    { name: 'NIKE', logoText: 'NIKE', imageUrl: null, order: 0 },
    { name: 'ADIDAS', logoText: 'ADIDAS', imageUrl: null, order: 1 },
    { name: 'NEW BALANCE', logoText: 'NEW BALANCE', imageUrl: null, order: 2 },
    { name: 'CONVERSE', logoText: 'CONVERSE', imageUrl: null, order: 3 },
    { name: 'VANS', logoText: 'VANS', imageUrl: null, order: 4 },
    { name: 'DR.MARTENS', logoText: 'DR.MARTENS', imageUrl: null, order: 5 },
    { name: 'UGG', logoText: 'UGG', imageUrl: null, order: 6 },
    { name: 'SKECHERS', logoText: 'SKECHERS', imageUrl: null, order: 7 },
    { name: 'CROCS', logoText: 'CROCS', imageUrl: null, order: 8 },
    { name: 'TIMBERLAND', logoText: 'TIMBERLAND', imageUrl: null, order: 9 },
];

export default function BrandSlider() {
    const [isPaused, setIsPaused] = useState(false);
    const [brands, setBrands] = useState<any[]>(defaultBrands);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadBrands = async () => {
            try {
                const result = await fetchBrandLogosAction();
                if (result.success && result.logos && result.logos.length > 0) {
                    setBrands(result.logos);
                }
            } catch (error) {
                console.error("Failed to load brand logos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBrands();
    }, []);

    // 무한 스크롤을 위해 브랜드 목록 복제 (아이템이 너무 적으면 3~4배 복제)
    const duplicatedBrands = brands.length < 5
        ? [...brands, ...brands, ...brands, ...brands]
        : [...brands, ...brands];

    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4 overflow-hidden">
                {/* 섹션 타이틀 - BEST SELLERS와 동일한 스타일 */}
                <div className="mb-8 text-center">
                    <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Featured</p>
                    <h2 className="text-2xl font-medium tracking-tight">PREMIUM BRANDS</h2>
                </div>

                {/* 슬라이더 컨테이너 - 호버 확대 시 잘림 방지를 위해 패딩 추가 */}
                <div
                    className="relative py-6"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* 슬라이더 트랙 */}
                    <div
                        className="flex gap-6 md:gap-8"
                        style={{
                            width: 'max-content',
                            animation: brands.length > 0 ? 'brandScroll 30s linear infinite' : 'none',
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                    >
                        {duplicatedBrands.map((brand, index) => (
                            <div
                                key={`${brand.name}-${index}`}
                                className="flex-shrink-0 group"
                            >
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center transition-all duration-300 ease-out cursor-pointer group-hover:scale-110 group-hover:shadow-lg group-hover:border-gray-300 group-hover:bg-gray-50 overflow-hidden relative">
                                    {brand.imageUrl ? (
                                        <div className="relative w-16 h-16 md:w-20 md:h-20">
                                            <Image
                                                src={brand.imageUrl}
                                                alt={brand.name}
                                                fill
                                                className="object-contain transition-transform duration-300 group-hover:scale-110"
                                                sizes="(max-width: 768px) 64px, 80px"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wider text-center whitespace-pre-line leading-tight transition-all duration-300 group-hover:text-gray-900 px-2">
                                            {brand.name}
                                        </span>
                                    )}
                                </div>
                                {/* 브랜드명 툴팁 */}
                                <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs text-gray-500 h-4">
                                    {brand.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 좌우 그라데이션 페이드 */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
                </div>
            </div>

            {/* 슬라이드 애니메이션 CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes brandScroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                `
            }} />
        </section>
    );
}
