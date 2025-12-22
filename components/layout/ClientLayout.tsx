"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { KakaoButton } from "@/components/ui/KakaoButton";
import { ClickRipple } from "@/components/ui/ClickRipple";
import { ImageProtection } from "@/components/ui/ImageProtection";
import { usePathname } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import { PWAProvider } from "@/context/PWAContext";
import { PWARegister } from "@/components/PWARegister";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLandingPage = pathname === "/";
    const isPartnerPage = pathname === "/partner";
    const isAdminPage = pathname?.startsWith("/admin");
    const isSamplePage = pathname?.startsWith("/sample");
    const hideNavigation = isLandingPage || isPartnerPage || isSamplePage;

    return (
        <AuthProvider>
            <WishlistProvider>
                <CartProvider>
                    <ToastProvider>
                        <PWAProvider>
                            {/* PWA Register */}
                            <PWARegister />

                            {/* 이미지 보호 - 관리자 페이지 제외 */}
                            {!isAdminPage && <ImageProtection />}
                            <ClickRipple />
                            {!hideNavigation && !isAdminPage && <Header />}
                            <main className={hideNavigation || isAdminPage ? "min-h-screen" : "min-h-screen"}>
                                {children}
                            </main>
                            {!hideNavigation && !isAdminPage && <Footer />}
                            {!hideNavigation && !isAdminPage && (
                                <KakaoButton />
                            )}
                        </PWAProvider>
                    </ToastProvider>
                </CartProvider>
            </WishlistProvider>
        </AuthProvider>
    );
}
