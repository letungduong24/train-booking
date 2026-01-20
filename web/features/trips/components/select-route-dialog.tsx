"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRoutes } from "@/features/routes/hooks/use-routes"
import { Route } from "@/lib/schemas/route.schema"

interface SelectRouteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (route: Route) => void
    selectedRouteId?: string
}

export function SelectRouteDialog({ open, onOpenChange, onSelect, selectedRouteId }: SelectRouteDialogProps) {
    const [searchValue, setSearchValue] = React.useState("")
    const [page, setPage] = React.useState(1)

    const { data: routeData } = useRoutes({
        page,
        limit: 5,
        search: searchValue,
        status: 'active'
    })

    const routes = routeData?.data || []
    const meta = routeData?.meta || { total: 0, page: 1, limit: 5, totalPages: 0 }

    const handleSelect = (route: Route) => {
        onSelect(route)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle>Chọn tuyến đường</DialogTitle>
                    <DialogDescription>
                        Tìm kiếm và chọn tuyến đường cho chuyến tàu
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Input
                        placeholder="Tìm kiếm tuyến đường..."
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value)
                            setPage(1)
                        }}
                    />

                    <ScrollArea className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên tuyến</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {routes.length > 0 ? (
                                    routes.map((route) => (
                                        <TableRow key={route.id}>
                                            <TableCell className="font-medium">{route.name}</TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {route.status === 'active' ? 'Hoạt động' : 'Nháp'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant={selectedRouteId === route.id ? "default" : "outline"}
                                                    onClick={() => handleSelect(route)}
                                                >
                                                    {selectedRouteId === route.id ? "Đã chọn" : "Chọn"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Không có tuyến đường khả dụng
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    {/* Pagination */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                            {routes.length} / {meta.total} tuyến
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-8 px-2"
                            >
                                Trước
                            </Button>
                            <div className="flex items-center px-2 text-sm whitespace-nowrap">
                                {meta.page} / {meta.totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= meta.totalPages}
                                className="h-8 px-2"
                            >
                                Tiếp
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
