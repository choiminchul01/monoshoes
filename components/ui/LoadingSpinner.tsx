/**
 * LoadingSpinner - 로딩 상태를 표시하는 스피너 컴포넌트
 * 
 * 사용 예시:
 * <LoadingSpinner size="medium" />
 * <LoadingSpinner size="small" variant="dots" />
 */

import React from 'react';

interface LoadingSpinnerProps {
    /** 스피너 크기: small(16px), medium(24px), large(48px) */
    size?: 'small' | 'medium' | 'large';

    /** 스피너 스타일: spinner(빙글빙글), dots(점 3개) */
    variant?: 'spinner' | 'dots';

    /** 스피너 색상 (기본: 검은색) */
    color?: string;

    /** 화면 중앙에 표시할지 여부 */
    centered?: boolean;
}

export function LoadingSpinner({
    size = 'medium',
    variant = 'spinner',
    color = 'black',
    centered = false,
}: LoadingSpinnerProps) {
    // 크기별 픽셀 값
    const sizeMap = {
        small: 'w-4 h-4',    // 16px
        medium: 'w-6 h-6',   // 24px
        large: 'w-12 h-12',  // 48px
    };

    // 중앙 정렬 클래스
    const centerClass = centered ? 'flex items-center justify-center' : '';

    // 1. 빙글빙글 도는 스피너 (기본)
    if (variant === 'spinner') {
        return (
            <div className={centerClass}>
                <div
                    className={`${sizeMap[size]} animate-spin rounded-full border-2 border-gray-200`}
                    style={{
                        borderTopColor: color,
                    }}
                    role="status"
                    aria-label="로딩 중"
                >
                    <span className="sr-only">로딩 중...</span>
                </div>
            </div>
        );
    }

    // 2. 점 3개가 통통 튀는 스피너
    if (variant === 'dots') {
        const dotSize = size === 'small' ? 'w-1.5 h-1.5' : size === 'large' ? 'w-3 h-3' : 'w-2 h-2';

        return (
            <div className={`flex items-center gap-1 ${centerClass}`} role="status" aria-label="로딩 중">
                <div
                    className={`${dotSize} rounded-full animate-bounce`}
                    style={{
                        backgroundColor: color,
                        animationDelay: '0ms'
                    }}
                />
                <div
                    className={`${dotSize} rounded-full animate-bounce`}
                    style={{
                        backgroundColor: color,
                        animationDelay: '150ms'
                    }}
                />
                <div
                    className={`${dotSize} rounded-full animate-bounce`}
                    style={{
                        backgroundColor: color,
                        animationDelay: '300ms'
                    }}
                />
                <span className="sr-only">로딩 중...</span>
            </div>
        );
    }

    return null;
}
