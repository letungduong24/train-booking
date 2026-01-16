import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { StationsTable } from "@/features/stations/components/stations-table"

export default function StationsPage() {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Quản lý trạm dừng</h1>
                            <p className="text-muted-foreground">Danh sách và quản lý các trạm dừng trong hệ thống.</p>
                        </div>
                    </div>

                    <StationsTable />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

