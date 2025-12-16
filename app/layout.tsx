import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Outfit } from "next/font/google";
import { Cinzel } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { metadata as siteMetadata, viewport as siteViewport } from "./metadata";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["700"], variable: "--font-cinzel" });

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = siteViewport;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${cinzel.variable}`} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
