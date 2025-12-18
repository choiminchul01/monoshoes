"use client";

import { X } from "lucide-react";

type ConfirmModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    children?: React.ReactNode;
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "확인",
    cancelText = "취소",
    isDangerous = false,
    children,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#001E10] to-[#000000] opacity-95" />

            {/* Brand Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <h1
                    className="text-[15vw] font-bold text-[#D4AF37] opacity-10 select-none whitespace-nowrap tracking-widest"
                    style={{ fontFamily: 'var(--font-cinzel), serif' }}
                >
                    ESSENTIA
                </h1>
            </div>

            <div className="relative z-10 bg-[#FDFCF5] rounded-lg p-6 max-w-md w-full mx-4 border border-[#D4AF37]/30 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-gray-600 mb-4 whitespace-pre-wrap">{message}</p>

                {children && <div className="mb-4">{children}</div>}

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-white rounded-lg transition-colors ${isDangerous
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-[#00704A] hover:bg-[#005A3C]"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
