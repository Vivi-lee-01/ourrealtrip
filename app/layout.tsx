import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// 아워리얼트립 루트 레이아웃 (docs/DESIGN_BRIEF.md 3·12절)
// 한국어 lang=ko + 모바일 우선 viewport + Tailwind globals import.
// 폰트: Inter(라틴/UI) → --font-sans, JetBrains Mono(수치 전용) → --font-mono.
// 한글 본문은 globals.css의 fallback 스택으로 자연스럽게 섞인다.
// 미로드(네트워크 불가) 시에도 CSS 변수 fallback이 동작하므로 화면은 깨지지 않는다.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  // 한글 fallback은 globals.css의 var(--font-sans) 스택이 이어받는다
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Apple SD Gothic Neo",
    "Pretendard",
    "Noto Sans KR",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "아워리얼트립",
  description:
    "모임이 함께 갈 여행을 제안하고, 관심·투표·질문으로 의향을 확인한 뒤 실제 상품 링크로 잇는 커뮤니티 여행 워크스페이스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-surface-soft text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
