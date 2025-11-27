/**
 * ToastContext - Toast 알림을 어디서든 쉽게 사용할 수 있게 해주는 Context
 * 
 * 사용 방법:
 * 1. app/layout.tsx에 <ToastProvider> 추가
 * 2. 컴포넌트에서 useToast() 사용
 * 3. toast.success("성공!") 호출
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast, ToastProps, ToastType } from '@/components/ui/Toast';

// Toast 데이터 타입
interface ToastData {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

// Context 타입
interface ToastContextType {
    /** 성공 알림 표시 */
    success: (message: string, duration?: number) => void;

    /** 에러 알림 표시 */
    error: (message: string, duration?: number) => void;

    /** 경고 알림 표시 */
    warning: (message: string, duration?: number) => void;

    /** 정보 알림 표시 */
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider 컴포넌트
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    // Toast 추가 함수
    const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        setToasts((prevToasts) => {
            // 최대 3개까지만 표시
            const newToasts = [...prevToasts, { id, type, message, duration }];
            return newToasts.slice(-3);
        });
    }, []);

    // Toast 제거 함수
    const removeToast = useCallback((id: string) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    // Context 값
    const value: ToastContextType = {
        success: (message, duration) => addToast('success', message, duration),
        error: (message, duration) => addToast('error', message, duration),
        warning: (message, duration) => addToast('warning', message, duration),
        info: (message, duration) => addToast('info', message, duration),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast 컨테이너 - 화면 하단 중앙 */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            id={toast.id}
                            type={toast.type}
                            message={toast.message}
                            duration={toast.duration}
                            onClose={removeToast}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

// Custom Hook
export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast는 ToastProvider 안에서만 사용할 수 있습니다.');
    }

    return context;
}
