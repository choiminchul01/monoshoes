import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
    title: "MONO SHOES",
    description: "프리미엄 신발 전문 쇼핑몰 — 여성화, 남성화, 스니커즈, 부츠까지 한 곳에서",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "모노슈즈",
    },
};

export const viewport: Viewport = {
    themeColor: "#00704A",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};
