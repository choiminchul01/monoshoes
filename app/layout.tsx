"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Outfit } from "next/font/google";
import { Cinzel } from "next/font/google";
import "./globals.css";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["700"], variable: "--font-cinzel" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isPartnerPage = pathname === "/partner";
  const isAdminPage = pathname?.startsWith("/admin");
  const hideNavigation = isLandingPage || isPartnerPage;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${cinzel.variable}`} suppressHydrationWarning>
        <PWARegister />
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <ToastProvider>
                {/* 이미지 보호 - 관리자 페이지 제외 */}
                {!isAdminPage && <ImageProtection />}
                <ClickRipple />
                {!hideNavigation && !isAdminPage && <Header />}
                <main className={hideNavigation || isAdminPage ? "min-h-screen" : "min-h-screen pt-0 md:pt-20"}>
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
      </body>
    </html>
  );
}
