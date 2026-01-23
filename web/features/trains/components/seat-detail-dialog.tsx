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
import { getSeatStatusLabel, getSeatTypeIcon, getSeatTypeLabel } from "@/lib/utils/seat-helper"

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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Chi tiết ghế/giường</DialogTitle>
                    <DialogDescription>
                        Xem và chỉnh sửa thông tin ghế/giường
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Seat Name */}
                    <div className="space-y-2">
                        <Label>Số ghế/giường</Label>
                        <div className="text-2xl font-bold">{seat.name}</div>
                    </div>

                    {/* Position */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Hàng</Label>
                            <div className="font-medium">{seat.rowIndex + 1}</div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Cột</Label>
                            <div className="font-medium">{seat.colIndex + 1}</div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Trạng thái</Label>
                        <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AVAILABLE">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                                        <span>Còn trống</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="BOOKED">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                                        <span>Đã đặt</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="LOCKED">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                        <span>Đã khóa</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="DISABLED">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                                        <span>Vô hiệu hóa</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">Loại ghế</Label>
                        <Select value={type} onValueChange={(value: any) => setType(value)}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="VIP">
                                    <div className="flex items-center gap-2">
                                        <span>⭐</span>
                                        <span>{getSeatTypeLabel('VIP')}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="STANDARD">
                                    <div className="flex items-center gap-2">
                                        <span>🪑</span>
                                        <span>{getSeatTypeLabel('STANDARD')}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="ECONOMY">
                                    <div className="flex items-center gap-2">
                                        <span>💺</span>
                                        <span>{getSeatTypeLabel('ECONOMY')}</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="OTHER">
                                    <div className="flex items-center gap-2">
                                        <span>📍</span>
                                        <span>{getSeatTypeLabel('OTHER')}</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Current Status Display */}
                    <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Trạng thái hiện tại</div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{getSeatTypeIcon(seat.type)}</span>
                            <span className="font-medium">{getSeatStatusLabel(seat.status)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave}>
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
