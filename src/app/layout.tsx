import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "CoMuse - 공동집필 플랫폼",
  description:
    "소재 제공자, 집필자, 이어쓰기 작가가 함께 만드는 창작 플랫폼. AI가 기여도를 분석하고 이더리움으로 수익을 배분합니다.",
  keywords: ["공동집필", "협업창작", "소설", "시나리오", "IP", "Web3"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
