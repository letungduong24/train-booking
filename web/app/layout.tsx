import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import TanStackProvider from "@/components/providers/tanstack-provider";
import { Toaster } from "@/components/ui/sonner";
import { SocketInitializer } from "@/components/providers/socket-initializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản lý Tuyến Đường | Railway Management System",
  description: "Hệ thống quản lý tuyến đường, ga tàu và lịch trình tàu hỏa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TanStackProvider>
          <AuthProvider>
            <SocketInitializer />
            {children}
            <Toaster />
          </AuthProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
