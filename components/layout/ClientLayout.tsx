"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { KakaoButton } from "@/components/ui/KakaoButton";
import { ClickRipple } from "@/components/ui/ClickRipple";
import { ImageProtection } from "@/components/ui/ImageProtection";
import AddToHomeScreenBanner from "@/components/ui/AddToHomeScreenBanner";
import { usePathname } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
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
    const hideNavigation = isLandingPage || isPartnerPage;

    return (
        <AuthProvider>
            <WishlistProvider>
                <CartProvider>
                    <ToastProvider>
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
                        {/* 홈 화면 추가 배너 - 관리자/랜딩/파트너 페이지 제외 */}
                        {!hideNavigation && !isAdminPage && (
                            <AddToHomeScreenBanner />
                        )}
                    </ToastProvider>
                </CartProvider>
            </WishlistProvider>
        </AuthProvider>
    );
}
