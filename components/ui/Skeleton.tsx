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

/**
 * OrderCardSkeleton - 주문 카드 스켈레톤
 */
export function OrderCardSkeleton() {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
                {/* 주문 번호 */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>

                {/* 상태 배지 */}
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* 상품 정보 */}
            <div className="flex gap-4 mb-4">
                <Skeleton className="w-20 h-20" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="hML4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>

            {/* 하단 */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-9 w-20" />
            </div>
        </div>
    );
}

/**
 * DashboardStatSkeleton - 대시보드 통계 카드 스켈레톤
 */
export function DashboardStatSkeleton() {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                {/* 타이틀 */}
                <Skeleton className="h-4 w-24" />

                {/* 아이콘 */}
                <Skeleton variant="circle" className="w-10 h-10" />
            </div>

            {/* 값 */}
            <Skeleton className="h-8 w-32 mb-2" />

            {/* 서브타이틀 */}
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

/**
 * TableRowSkeleton - 테이블 행 스켈레톤
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, index) => (
                <td key={index} className="px-6 py-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}
