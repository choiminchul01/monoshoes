/**
 * PageLoader - 전체 화면 로딩 오버레이
 * 
 * 페이지가 로딩될 때 화면 전체를 덮는 로딩 화면입니다.
 * 
 * 사용 예시:
 * {loading && <PageLoader />}
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';

interface PageLoaderProps {
    /** 로딩 텍스트 (기본: "로딩 중...") */
    text?: string;

    /** 배경 투명도 (기본: 0.8) */
    opacity?: number;
}

export function PageLoader({
    text = '로딩 중...',
    opacity = 0.8
}: PageLoaderProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ backgroundColor: `rgba(255, 255, 255, ${opacity})` }}
            >
                <div className="flex flex-col items-center gap-4">
                    {/* 로딩 스피너 */}
                    <LoadingSpinner size="large" />

                    {/* 로딩 텍스트 */}
                    {text && (
                        <p className="text-sm font-medium text-gray-600 tracking-wide">
                            {text}
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
