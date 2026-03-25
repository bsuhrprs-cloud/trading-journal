import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "매매 복기 저널",
  description: "나의 주식 매매 복기 기록",
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
