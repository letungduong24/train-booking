import { AuthGuard } from '@/components/auth-guard';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 14)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="sidebar" />
                <SidebarInset className="min-w-0 overflow-x-hidden">
                    <SiteHeader />
                    <div className="flex flex-1 flex-col p-6">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    );
}
