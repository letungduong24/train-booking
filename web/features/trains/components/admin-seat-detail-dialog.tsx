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
import { getSeatTypeLabel } from "@/lib/mock-data/train"
import { Seat, SeatStatus, SeatType } from "@/lib/schemas/seat.schema"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Lock, Unlock, AlertCircle } from "lucide-react"

interface AdminSeatDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    seat: Seat | null
    onUpdate: (updatedSeat: Seat) => void
}

export function AdminSeatDetailDialog({
    open,
    onOpenChange,
    seat,
    onUpdate
}: AdminSeatDetailDialogProps) {
    const [selectedType, setSelectedType] = useState<SeatType>('STANDARD')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (seat) {
            setSelectedType(seat.type)
            setError(null)
        }
    }, [seat])

    if (!seat) return null

    const handleDisableToggle = () => {
        if (seat.status === 'AVAILABLE') {
            // Logic to disable (lock) the seat
            // In a real app, this would call an API
            const newStatus: SeatStatus = 'DISABLED'
            onUpdate({ ...seat, status: newStatus })
            onOpenChange(false)
        } else if (seat.status === 'DISABLED') {
            // Logic to unlock
            const newStatus: SeatStatus = 'AVAILABLE'
            onUpdate({ ...seat, status: newStatus })
            onOpenChange(false)
        } else {
            // Cannot disable if booked/reserved
            setError("Hiện không thể disable ghế, vui lòng xử lí các booking của khách trước khi disable ghế.")
        }
    }

    const handleTypeChange = (value: SeatType) => {
        setSelectedType(value)
    }

    const handleSaveType = () => {
        onUpdate({ ...seat, type: selectedType })
        onOpenChange(false)
    }

    const isLocked = seat.status === 'DISABLED'

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
                            seat.status === 'BOOKED' && "bg-red-500 hover:bg-red-600",
                            seat.status === 'LOCKED' && "bg-yellow-500 hover:bg-yellow-600", // Assuming LOCKED exists or is being used
                        )}>
                            {seat.status}
                        </Badge>
                    </div>

                    {/* Seat Type Selector */}
                    <div className="grid gap-2">
                        <Label htmlFor="seat-type">Hạng/Loại vé</Label>
                        <Select value={selectedType} onValueChange={(val) => handleTypeChange(val as SeatType)}>
                            <SelectTrigger id="seat-type">
                                <SelectValue placeholder="Chọn loại ghế" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STANDARD">{getSeatTypeLabel('STANDARD')}</SelectItem>
                                <SelectItem value="VIP">{getSeatTypeLabel('VIP')}</SelectItem>
                                <SelectItem value="ECONOMY">{getSeatTypeLabel('ECONOMY')}</SelectItem>
                                <SelectItem value="OTHER">{getSeatTypeLabel('OTHER')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Lock/Unlock Action */}
                    <div className="grid gap-2 border-t pt-4 mt-2">
                        <Label className="mb-2">Thao tác nhanh</Label>
                        <div className="flex flex-col gap-2">
                            {isLocked ? (
                                <Button
                                    variant="outline"
                                    className="w-full text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                    onClick={handleDisableToggle}
                                >
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Mở khóa ghế
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    onClick={handleDisableToggle}
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Khóa ghế (Disable)
                                </Button>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 mt-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button onClick={handleSaveType}>
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
