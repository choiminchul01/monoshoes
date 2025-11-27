/**
 * Toast - 화면에 나타나는 알림 메시지
 * 
 * "✅ 저장되었습니다!" 같은 메시지를 보여줍니다.
 * 3초 후 자동으로 사라집니다.
 */

'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    /** 고유 ID */
    id: string;

    /** 알림 타입 (success, error, warning, info) */
    type: ToastType;

    /** 표시할 메시지 */
    message: string;

    /** 자동으로 사라지는 시간 (밀리초, 기본: 3000) */
    duration?: number;

    /** 닫기 콜백 함수 */
    onClose: (id: string) => void;
}

export function Toast({
    id,
    type,
    message,
    duration = 3000,
    onClose
}: ToastProps) {
    // 타입별 색상 설정
    const styles = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: CheckCircle,
            iconColor: 'text-green-600',
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: AlertCircle,
            iconColor: 'text-red-600',
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            icon: AlertTriangle,
            iconColor: 'text-yellow-600',
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: Info,
            iconColor: 'text-blue-600',
        },
    };

    const style = styles[type];
    const Icon = style.icon;

    // 자동 닫기 타이머
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className={`
        ${style.bg} ${style.border} ${style.text}
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
        min-w-[300px] max-w-md
      `}
        >
            {/* 아이콘 */}
            <Icon className={`w-5 h-5 flex-shrink-0 ${style.iconColor}`} />

            {/* 메시지 */}
            <p className="flex-1 text-sm font-medium">
                {message}
            </p>

            {/* 닫기 버튼 */}
            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="알림 닫기"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
