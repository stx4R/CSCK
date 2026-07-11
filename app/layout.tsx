import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "제3회 오량모의국회 출석체크",
  description: "전자 태블릿 출석체크 시스템",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "출석체크",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
