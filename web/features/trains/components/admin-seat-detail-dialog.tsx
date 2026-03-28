"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Seat, SeatStatus } from "@/lib/schemas/seat.schema"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Lock, Unlock, AlertCircle } from "lucide-react"
import { useUpdateSeat } from "@/features/trains/hooks/use-seat-mutations"
import { toast } from "sonner"

interface AdminSeatDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    seat: Seat | null
    onUpdate?: (updatedSeat: Seat) => void
}

export function AdminSeatDetailDialog({
    open,
    onOpenChange,
    seat,
    onUpdate
}: AdminSeatDetailDialogProps) {
    const [error, setError] = useState<string | null>(null)
    const updateSeat = useUpdateSeat()

    useEffect(() => {
        if (seat) {
            setError(null)
        }
    }, [seat])

    if (!seat) return null

    const handleDisableToggle = () => {
        const newStatus: SeatStatus = seat.status === 'DISABLED' ? 'AVAILABLE' : 'DISABLED'

        updateSeat.mutate(
            { id: seat.id, data: { status: newStatus } },
            {
                onSuccess: () => {
                    toast.success(newStatus === 'DISABLED' ? "Đã khóa ghế" : "Đã mở khóa ghế");
                    onOpenChange(false);
                },
                onError: (err) => {
                    toast.error("Cập nhật thất bại");
                    console.error(err);
                }
            }
        )
    }

    const isDisabled = seat.status === 'DISABLED'
    const isBooked = false // Physical seats are never 'BOOKED'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Quản lý ghế {seat.name}</DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Điều chỉnh thông tin và trạng thái của ghế/giường.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-6">
                    {/* Status Display */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Trạng thái hiện tại</Label>
                        <Badge variant={seat.status === 'AVAILABLE' ? 'default' : 'secondary'} className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-bold border-none",
                            seat.status === 'AVAILABLE' && "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
                            seat.status === 'DISABLED' && "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400",
                        )}>
                            {seat.status === 'DISABLED' ? 'Đã vô hiệu hóa' : 'Đang hoạt động'}
                        </Badge>
                    </div>

                    {/* Lock/Unlock Action */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Thao tác nhanh</Label>
                        <div className="flex flex-col gap-3">
                            {isDisabled ? (
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl text-emerald-600 border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-900/10 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all font-bold shadow-sm"
                                    onClick={handleDisableToggle}
                                    disabled={updateSeat.isPending}
                                >
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Mở khóa ghế
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl text-rose-600 border-rose-100 dark:border-rose-900/20 bg-rose-50/30 dark:bg-rose-900/10 hover:bg-[#802222] hover:text-white hover:border-[#802222] transition-all font-bold shadow-sm"
                                    onClick={handleDisableToggle}
                                    disabled={isBooked || updateSeat.isPending}
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Khóa ghế (Vô hiệu hóa)
                                </Button>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 mt-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
