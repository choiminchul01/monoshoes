"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { KakaoButton } from "@/components/ui/KakaoButton";
import { CursorSparkle } from "@/components/ui/CursorSparkle";
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
      <body className="font-sans antialiased">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <ToastProvider>
                <CursorSparkle />
                {!isLandingPage && !isAdminPage && <Header />}
                <main className={isLandingPage || isAdminPage ? "min-h-screen" : "min-h-screen pt-20"}>
                  {children}
                </main>
                {!isLandingPage && !isAdminPage && <Footer />}
                {!isLandingPage && !isAdminPage && <KakaoButton />}
              </ToastProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
