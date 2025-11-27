/**
 * Skeleton - 로딩 중 콘텐츠 대신 표시되는 스켈레톤 UI
 * 
 * 사용 예시:
 * <Skeleton className="w-full h-48" />
 * <Skeleton variant="circle" className="w-12 h-12" />
 */

import React from 'react';

interface SkeletonProps {
    /** 스켈레톤 변형: rectangle(기본), circle, text */
    variant?: 'rectangle' | 'circle' | 'text';

    /** 커스텀 클래스명 (Tailwind) */
    className?: string;

    /** 애니메이션 활성화 여부 (기본: true) */
    animate?: boolean;
}

export function Skeleton({
    variant = 'rectangle',
    className = '',
    animate = true,
}: SkeletonProps) {
    // 기본 스타일
    const baseStyles = 'bg-gray-200';

    // 애니메이션 스타일
    const animationStyles = animate ? 'animate-pulse' : '';

    // 변형별 스타일
    const variantStyles = {
        rectangle: 'rounded',
        circle: 'rounded-full',
        text: 'rounded h-4',
    };

    return (
        <div
            className={`${baseStyles} ${animationStyles} ${variantStyles[variant]} ${className}`}
            role="status"
            aria-label="로딩 중"
        >
            <span className="sr-only">로딩 중...</span>
        </div>
    );
}

/**
 * ProductCardSkeleton - ProductCard 스켈레톤
 */
export function ProductCardSkeleton({ aspectRatio = 'aspect-[3/4]' }: { aspectRatio?: string }) {
    return (
        <div className="block">
            {/* 이미지 스켈레톤 */}
            <Skeleton className={`${aspectRatio} w-full`} />

            {/* 텍스트 스켈레톤 */}
            <div className="mt-4 space-y-2">
                <Skeleton variant="text" className="w-16" />
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-20" />
            </div>
        </div>
    );
}

/**
 * ProductDetailImageSkeleton - 상품 상세 이미지 스켈레톤
 */
export function ProductDetailImageSkeleton() {
    return (
        <div className="w-full lg:w-5/12 space-y-4">
            {/* 메인 이미지 */}
            <Skeleton className="aspect-[3/4] w-full" />

            {/* 썸네일 그리드 */}
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-[3/4]" />
                ))}
            </div>
        </div>
    );
}
