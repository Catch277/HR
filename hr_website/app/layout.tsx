import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Humora | HR & Shift Intelligence",
  description: "Hệ thống quản lý nhân sự và vận hành Humora",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body
        className={`${beVietnamPro.variable} flex h-dvh overflow-hidden bg-[#F8F9FF] font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900`}
      >
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="min-h-0 flex-1 overflow-y-auto bg-[#F8F9FF] p-4 md:p-6">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
