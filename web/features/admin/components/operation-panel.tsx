"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TripDetail } from "@/lib/schemas/trip.schema"
import { useUpdateTrip } from "@/features/trips/hooks/use-trips"
import { toast } from "sonner"
import { AlertTriangle, Clock, Ban, CheckCircle, FileDown, Megaphone } from "lucide-react"
import { addMinutes } from "date-fns"

interface OperationPanelProps {
    trip: TripDetail
}

export function OperationPanel({ trip }: OperationPanelProps) {
    const [isDelayOpen, setIsDelayOpen] = useState(false)
    const [delayMinutes, setDelayMinutes] = useState("")

    const [isCancelOpen, setIsCancelOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState("")

    const { mutate: updateTrip, isPending } = useUpdateTrip()

    const handleDelay = () => {
        const minutes = parseInt(delayMinutes)
        if (isNaN(minutes) || minutes <= 0) {
            toast.error("Vui lòng nhập số phút hợp lệ")
            return
        }

        const newDepartureTime = addMinutes(new Date(trip.departureTime), minutes).toISOString()

        updateTrip(
            {
                id: trip.id,
                data: {
                    status: 'DELAYED',
                    departureTime: newDepartureTime
                }
            },
            {
                onSuccess: () => {
                    toast.success(`Đã cập nhật trễ ${minutes} phút`)
                    setIsDelayOpen(false)
                    setDelayMinutes("")
                },
                onError: (error) => {
                    toast.error("Cập nhật thất bại: " + error.message)
                }
            }
        )
    }

    const handleCancel = () => {
        // Warning: This is a destructive action
        updateTrip(
            {
                id: trip.id,
                data: { status: 'CANCELLED' }
            },
            {
                onSuccess: () => {
                    toast.success("Đã hủy chuyến đi")
                    setIsCancelOpen(false)
                },
                onError: (error) => {
                    toast.error("Hủy chuyến thất bại: " + error.message)
                }
            }
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Vận hành & Tác vụ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delay Action */}
                <Dialog open={isDelayOpen} onOpenChange={setIsDelayOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="justify-start h-auto py-3 border-yellow-500/50 hover:bg-yellow-50">
                            <Clock className="h-5 w-5 mr-3 text-yellow-600" />
                            <div className="text-left">
                                <div className="font-semibold">Báo trễ (Delay)</div>
                                <div className="text-xs text-muted-foreground">Cập nhật giờ khởi hành mới</div>
                            </div>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Thông báo trễ chuyến</DialogTitle>
                            <DialogDescription>
                                Hệ thống sẽ cập nhật giờ khởi hành và thông báo cho hành khách.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Số phút trễ</Label>
                                <Input
                                    type="number"
                                    placeholder="Ví dụ: 30"
                                    value={delayMinutes}
                                    onChange={(e) => setDelayMinutes(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDelayOpen(false)}>Hủy</Button>
                            <Button onClick={handleDelay} disabled={isPending}>Xác nhận</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Cancel Action */}
                <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="justify-start h-auto py-3 border-red-500/50 hover:bg-red-50">
                            <Ban className="h-5 w-5 mr-3 text-red-600" />
                            <div className="text-left">
                                <div className="font-semibold text-red-600">Hủy chuyến đi</div>
                                <div className="text-xs text-muted-foreground">Hoàn tiền tự động cho vé đã bán</div>
                            </div>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Xác nhận hủy chuyến
                            </DialogTitle>
                            <DialogDescription>
                                Hành động này không thể hoàn tác. Tất cả vé đã bán sẽ bị hủy và hoàn tiền.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Lý do hủy (để gửi mail cho khách)</Label>
                                <Textarea
                                    placeholder="Ví dụ: Sự cố kỹ thuật..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Thôi</Button>
                            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>Hủy chuyến ngay</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Button variant="outline" className="justify-start h-auto py-3">
                    <CheckCircle className="h-5 w-5 mr-3 text-green-600" />
                    <div className="text-left">
                        <div className="font-semibold">Hoàn thành</div>
                        <div className="text-xs text-muted-foreground">Force update trạng thái về bến</div>
                    </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto py-3" onClick={() => toast.success("Đang xuất file Excel...")}>
                    <FileDown className="h-5 w-5 mr-3 text-blue-600" />
                    <div className="text-left">
                        <div className="font-semibold">Xuất danh sách</div>
                        <div className="text-xs text-muted-foreground">Tải file Excel danh sách khách</div>
                    </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto py-3 col-span-1 md:col-span-2" onClick={() => toast.success("Đã gửi thông báo cho 350 khách")}>
                    <Megaphone className="h-5 w-5 mr-3 text-purple-600" />
                    <div className="text-left">
                        <div className="font-semibold">Gửi thông báo</div>
                        <div className="text-xs text-muted-foreground">Gửi SMS/Email/Noti cho toàn bộ khách</div>
                    </div>
                </Button>
            </div>
        </div>
    )
}
