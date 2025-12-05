"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Outfit } from "next/font/google";
import "./globals.css";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <ToastProvider>
                {/* 이미지 보호 - 관리자 페이지 제외 */}
                {!isAdminPage && <ImageProtection />}
                <ClickRipple />
                {!isLandingPage && !isAdminPage && <Header />}
                <main className={isLandingPage || isAdminPage ? "min-h-screen" : "min-h-screen pt-20"}>
                  {children}
                </main>
                {!isLandingPage && !isAdminPage && <Footer />}
                {!isLandingPage && !isAdminPage && (
                  <KakaoButton />
                )}
              </ToastProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
