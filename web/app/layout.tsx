import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import TanStackProvider from "@/components/providers/tanstack-provider";
import { Toaster } from "@/components/ui/sonner";
import { SocketInitializer } from "@/components/providers/socket-initializer";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Railflow | Đặt vé tàu trực tuyến",
  description: "Nền tảng đặt vé tàu, thanh toán, quản lý chuyến đi và theo dõi hành trình trực tuyến",
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
