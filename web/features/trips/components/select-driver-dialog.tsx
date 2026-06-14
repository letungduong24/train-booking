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
import { useDrivers } from "@/features/trips/hooks/use-trips"
import { cn } from "@/lib/utils"

interface DriverType {
    id: string
    name: string | null
    email: string
    phone: string | null
}

interface SelectDriverDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (driver: DriverType) => void
    selectedDriverId?: string
}

export function SelectDriverDialog({ open, onOpenChange, onSelect, selectedDriverId }: SelectDriverDialogProps) {
    const [searchValue, setSearchValue] = React.useState("")
    const [page, setPage] = React.useState(1)
    const limit = 5

    const { data: allDrivers = [] } = useDrivers()

    // Filter drivers locally
    const filteredDrivers = React.useMemo(() => {
        return allDrivers.filter(driver => {
            const nameMatch = driver.name?.toLowerCase().includes(searchValue.toLowerCase()) || false
            const emailMatch = driver.email.toLowerCase().includes(searchValue.toLowerCase())
            const phoneMatch = driver.phone?.includes(searchValue) || false
            return nameMatch || emailMatch || phoneMatch
        })
    }, [allDrivers, searchValue])

    // Paginate locally
    const total = filteredDrivers.length
    const totalPages = Math.ceil(total / limit)
    const paginatedDrivers = React.useMemo(() => {
        const skip = (page - 1) * limit
        return filteredDrivers.slice(skip, skip + limit)
    }, [filteredDrivers, page, limit])

    // Reset page on search change
    React.useEffect(() => {
        setPage(1)
    }, [searchValue])

    const handleSelect = (driver: DriverType) => {
        onSelect(driver)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Chọn Lái tàu</DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Tìm kiếm và phân công nhân sự lái tàu chịu trách nhiệm vận hành chuyến đi
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 pb-8 space-y-4 flex-1 flex flex-col min-h-0">
                    <div className="relative">
                        <Input
                            placeholder="Tìm kiếm theo tên, email hoặc SĐT..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="h-12 pl-10 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800 focus:ring-rose-500/20"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                    </div>

                    <ScrollArea className="border-none rounded-3xl bg-gray-50/30 dark:bg-zinc-900/30 flex-1 min-h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest pl-6">Thông tin Lái tàu</TableHead>
                                    <TableHead className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">SĐT</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedDrivers.length > 0 ? (
                                    paginatedDrivers.map((driver) => (
                                        <TableRow key={driver.id} className="group border-none hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <TableCell className="pl-6 py-4">
                                                <div>
                                                    <div className="font-bold text-sm text-zinc-850 dark:text-zinc-200">
                                                        {driver.name || "Chưa đặt tên"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/60">
                                                        {driver.email}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-muted-foreground">
                                                {driver.phone || "N/A"}
                                            </TableCell>
                                            <TableCell className="pr-6">
                                                <Button
                                                    size="sm"
                                                    variant={selectedDriverId === driver.id ? "default" : "ghost"}
                                                    onClick={() => handleSelect(driver)}
                                                    className={cn(
                                                        "rounded-full h-8 text-xs font-bold transition-all px-6",
                                                        selectedDriverId === driver.id
                                                            ? "bg-[#802222] hover:bg-rose-900 text-white shadow-lg shadow-rose-900/25"
                                                            : "bg-rose-50 text-[#802222] hover:bg-rose-100 hover:text-rose-900 border-none shadow-sm"
                                                    )}
                                                >
                                                    {selectedDriverId === driver.id ? "Đã chọn" : "Chọn"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2 opacity-20">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                                <p className="text-sm font-medium">Không có lái tàu khả dụng</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    {/* Pagination */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                        <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-2">
                            {paginatedDrivers.length} / {total} nhân sự
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-9 px-4 rounded-full border-gray-100 dark:border-zinc-800 text-xs font-bold"
                            >
                                Trước
                            </Button>
                            <div className="flex items-center px-3 text-xs font-bold text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 rounded-full">
                                {page} / {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages}
                                className="h-9 px-4 rounded-full border-gray-100 dark:border-zinc-800 text-xs font-bold"
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
