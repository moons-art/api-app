import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "CEUM AI Assistant - 설교 및 교회 행정 지원",
  description: "RAG 기반의 강력한 교회 AI 비서 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        {/* Configure Tailwind dynamically for the CDN */}
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'apple-blue': '#007aff',
                  'apple-gray': '#1c1c1e',
                  'apple-light-gray': '#2c2c2e',
                  'text-primary': '#ffffff',
                  'text-secondary': '#8e8e93',
                }
              }
            }
          }
        `}} />
      </head>
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
