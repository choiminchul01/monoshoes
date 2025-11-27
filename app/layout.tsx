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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <CursorSparkle />
              {!isLandingPage && <Header />}
              <main className={isLandingPage ? "min-h-screen" : "min-h-screen pt-20"}>
                {children}
              </main>
              {!isLandingPage && <Footer />}
              {!isLandingPage && <KakaoButton />}
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
