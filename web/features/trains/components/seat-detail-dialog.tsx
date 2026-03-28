"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Seat } from "@/lib/schemas/seat.schema"
import { getSeatStatusLabel } from "@/lib/utils/seat-helper"

interface SeatDetailDialogProps {
    seat: Seat | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (seat: Seat) => void
}

export function SeatDetailDialog({
    seat,
    open,
    onOpenChange,
    onSave,
}: SeatDetailDialogProps) {
    const [status, setStatus] = React.useState(seat?.status ?? 'AVAILABLE')
    const [type, setType] = React.useState(seat?.type ?? 'STANDARD')

    React.useEffect(() => {
        if (seat) {
            setStatus(seat.status)
            setType(seat.type)
        }
    }, [seat])

    if (!seat) return null

    const handleSave = () => {
        onSave({
            ...seat,
            status,
            type,
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-[#802222] dark:text-rose-400">
                            {seat.name}
                        </div>
                        Chi tiết ghế/giường
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Cấu hình trạng thái và loại chỗ cho mã {seat.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 pb-4 space-y-6">
                    {/* Position info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Hàng</div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{seat.rowIndex + 1}</div>
                        </div>
                        <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Cột</div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{seat.colIndex + 1}</div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Trạng thái vận hành</Label>
                        <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                            <SelectTrigger id="status" className="h-12 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="AVAILABLE" className="rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span className="font-medium">Còn trống</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="BOOKED" className="rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        <span className="font-medium">Đã đặt</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="LOCKED" className="rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                        <span className="font-medium">Đã khóa</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="DISABLED" className="rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-zinc-400 rounded-full" />
                                        <span className="font-medium">Vô hiệu hóa</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type display */}
                    <div className="p-4 rounded-2xl bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/20">
                        <div className="text-[10px] font-bold text-rose-800/40 dark:text-rose-400/40 uppercase tracking-wider mb-1">Loại chỗ hiện tại</div>
                        <div className="font-bold text-sm text-[#802222] dark:text-rose-400">{getSeatStatusLabel(seat.status)}</div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-2 gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-medium">Hủy</Button>
                    <Button onClick={handleSave} className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20 px-8">Lưu thay đổi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
