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
                    <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                        <DialogHeader className="p-8 pb-4">
                            <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight flex items-center gap-2">
                                <Clock className="w-5 h-5 opacity-40" />
                                Thông báo trễ chuyến
                            </DialogTitle>
                            <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                                Hệ thống sẽ cập nhật giờ khởi hành và thông báo cho hành khách.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="px-8 pb-4 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Số phút trễ</Label>
                                <Input
                                    type="number"
                                    placeholder="Ví dụ: 30"
                                    value={delayMinutes}
                                    onChange={(e) => setDelayMinutes(e.target.value)}
                                    className="h-12 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800"
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-8 pt-2 gap-3">
                            <Button variant="ghost" onClick={() => setIsDelayOpen(false)} className="rounded-xl font-medium">Hủy</Button>
                            <Button onClick={handleDelay} disabled={isPending} className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20 px-8">Xác nhận</Button>
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
                    <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                        <DialogHeader className="p-8 pb-4 text-center sm:text-left">
                            <DialogTitle className="text-xl font-bold text-red-600 dark:text-red-400 tracking-tight flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 opacity-40" />
                                Xác nhận hủy chuyến
                            </DialogTitle>
                            <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                                Hành động này không thể hoàn tác. Tất cả vé đã bán sẽ bị hủy và hoàn tiền.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="px-8 pb-4 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Lý do hủy (để gửi mail cho khách)</Label>
                                <Textarea
                                    placeholder="Ví dụ: Sự cố kỹ thuật..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800 min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter className="p-8 pt-2 gap-3">
                            <Button variant="ghost" onClick={() => setIsCancelOpen(false)} className="rounded-xl font-medium">Thôi</Button>
                            <Button variant="destructive" onClick={handleCancel} disabled={isPending} className="rounded-xl h-11 font-bold shadow-lg shadow-red-900/20 px-8">Hủy chuyến ngay</Button>
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
