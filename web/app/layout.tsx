import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import TanStackProvider from "@/components/providers/tanstack-provider";
import { Toaster } from "@/components/ui/sonner";
import { SocketInitializer } from "@/components/providers/socket-initializer";
import { ThemeProvider } from "@/components/theme-provider";

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
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <TanStackProvider>
          <AuthProvider>
            <SocketInitializer />
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
