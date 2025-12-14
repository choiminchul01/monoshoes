import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "ESSENTIA",
    description: "하이엔드 퀄리티 제품을 쉽고 빠르게 만나보세요",
    manifest: "/manifest.json",
    themeColor: "#00704A",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "에센시아",
    },
    viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
    },
};
