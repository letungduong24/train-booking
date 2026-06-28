"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Seat } from "@/lib/schemas/seat.schema"
import { cn } from "@/lib/utils"

interface AdminSeatDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    seat: Seat | null
}

export function AdminSeatDetailDialog({
    open,
    onOpenChange,
    seat,
}: AdminSeatDetailDialogProps) {
    if (!seat) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">
                        Thông tin ghế {seat.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Hiển thị thông tin và trạng thái hiện tại của ghế.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">
                            Trạng thái hiện tại
                        </Label>
                        <Badge
                            variant={seat.status === "AVAILABLE" ? "default" : "secondary"}
                            className={cn(
                                "rounded-full px-3 py-1 text-[10px] font-bold border-none",
                                seat.status === "AVAILABLE" && "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
                                seat.status === "DISABLED" && "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400",
                                seat.status === "MAINTENANCE" && "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                            )}
                        >
                            {seat.status === "DISABLED"
                                ? "Đã vô hiệu hóa"
                                : seat.status === "MAINTENANCE"
                                    ? "Đang bảo trì"
                                    : "Đang hoạt động"}
                        </Badge>
                    </div>

                    <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 text-sm font-medium text-[#802222] dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
                        Muốn xử lý ghế đã phát sinh khách, hãy dùng luồng báo cáo sự cố ghế theo từng chuyến để hệ thống gửi email đổi ghế hoặc hoàn tiền đúng hành khách.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
