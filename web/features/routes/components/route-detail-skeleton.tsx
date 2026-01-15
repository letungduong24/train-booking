import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RouteDetailSkeleton() {
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
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" disabled>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Skeleton className="h-8 w-48" />
                    </div>

                    <div className="flex-1 space-y-6">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b pb-4 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-64" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                        </div>

                        {/* Route Info */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 border p-4 rounded-md bg-muted/20">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold min-w-[80px]">Trạng thái:</span>
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold min-w-[80px]">Ngày tạo:</span>
                                <Skeleton className="h-6 w-32" />
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="rounded-md border overflow-hidden h-[400px] w-full bg-muted/10 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-pulse flex flex-col items-center gap-2">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        </div>

                        {/* Stations Table Skeleton */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton className="h-7 w-32" />
                                <Skeleton className="h-9 w-28" />
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30px]"><Skeleton className="h-4 w-4" /></TableHead>
                                            <TableHead className="w-[50px]"><Skeleton className="h-4 w-4" /></TableHead>
                                            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                                            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                                            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                                            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
