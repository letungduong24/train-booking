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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quản lý ghế {seat.name}</DialogTitle>
                    <DialogDescription>
                        Điều chỉnh thông tin và trạng thái của ghế/giường.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Status Display */}
                    <div className="flex items-center justify-between">
                        <Label>Trạng thái hiện tại</Label>
                        <Badge variant={seat.status === 'AVAILABLE' ? 'default' : 'secondary'} className={cn(
                            seat.status === 'AVAILABLE' && "bg-green-500 hover:bg-green-600",
                            seat.status === 'DISABLED' && "bg-muted hover:bg-muted/80 text-muted-foreground",
                        )}>
                            {seat.status === 'DISABLED' ? 'Đã vô hiệu hóa' : 'Hoạt động'}
                        </Badge>
                    </div>

                    {/* Lock/Unlock Action */}
                    <div className="grid gap-2 border-t pt-4 mt-2">
                        <Label className="mb-2">Thao tác nhanh</Label>
                        <div className="flex flex-col gap-2">
                            {isDisabled ? (
                                <Button
                                    variant="outline"
                                    className="w-full text-green-600 border-green-200 dark:border-green-800 hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-400"
                                    onClick={handleDisableToggle}
                                    disabled={updateSeat.isPending}
                                >
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Mở khóa ghế
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 border-red-200 dark:border-destructive/50 hover:bg-destructive/10 hover:text-red-700 dark:hover:text-red-400"
                                    onClick={handleDisableToggle}
                                    disabled={isBooked || updateSeat.isPending}
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Khóa ghế (Disable)
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

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
