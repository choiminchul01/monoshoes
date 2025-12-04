"use client";

import { useEffect } from "react";

/**
 * 이미지 보호 컴포넌트
 * - 우클릭 비활성화 (이미지에서만)
 * - 드래그 비활성화
 * - 키보드 단축키 차단 (Ctrl+S 등)
 */
export function ImageProtection() {
    useEffect(() => {
        // 이미지에서 우클릭 방지
        const handleContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "IMG" || target.closest("[data-protected-image]")) {
                e.preventDefault();
                return false;
            }
        };

        // 이미지 드래그 방지
        const handleDragStart = (e: DragEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "IMG") {
                e.preventDefault();
                return false;
            }
        };

        // 키보드 단축키 방지 (Ctrl+S, Ctrl+Shift+I 등)
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S (저장)
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("dragstart", handleDragStart);
        document.addEventListener("keydown", handleKeyDown);

        // 모든 이미지에 draggable="false" 속성 추가
        const images = document.querySelectorAll("img");
        images.forEach((img) => {
            img.setAttribute("draggable", "false");
        });

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("dragstart", handleDragStart);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return null;
}

/**
 * 이미지 오버레이 래퍼
 * 이미지 위에 투명 레이어를 추가하여 직접 접근 차단
 */
export function ProtectedImage({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`relative select-none ${className}`}
            data-protected-image="true"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
        >
            {children}
            {/* 투명 오버레이 - 이미지 직접 접근 차단 */}
            <div
                className="absolute inset-0 z-10"
                style={{ backgroundColor: "transparent" }}
                onContextMenu={(e) => e.preventDefault()}
            />
        </div>
    );
}
