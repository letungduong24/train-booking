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
import { useDeleteTrip } from "@/features/trips/hooks/use-trips"
import { useTripDelayMutations } from "@/features/trips/hooks/use-trip-delay-mutations"
import { toast } from "sonner"
import { AlertTriangle, Clock, Ban, CheckCircle, FileDown, Megaphone } from "lucide-react"

interface OperationPanelProps {
    trip: TripDetail
}

export function OperationPanel({ trip }: OperationPanelProps) {
    const [isDelayOpen, setIsDelayOpen] = useState(false)
    const [delayMinutes, setDelayMinutes] = useState("")

    const [isCancelOpen, setIsCancelOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState("")

    const {
        setDepartureDelay,
        isSettingDepartureDelay,
        setArrivalDelay,
        isSettingArrivalDelay,
    } = useTripDelayMutations(trip.id)
    const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip()
    const isDelayPending = isSettingDepartureDelay || isSettingArrivalDelay

    const handleDelay = () => {
        const minutes = parseInt(delayMinutes)
        if (isNaN(minutes) || minutes <= 0) {
            toast.error("Vui lòng nhập số phút hợp lệ")
            return
        }

        const mutationOptions = {
            onSuccess: () => {
                setIsDelayOpen(false)
                setDelayMinutes("")
            },
        }

        if (trip.status === "SCHEDULED") {
            setDepartureDelay(minutes, mutationOptions)
            return
        }

        if (trip.status === "IN_PROGRESS") {
            setArrivalDelay(minutes, mutationOptions)
            return
        }

        toast.error("Chỉ cập nhật delay cho chuyến SCHEDULED hoặc IN_PROGRESS")
    }

    const handleCancel = () => {
        deleteTrip(
            trip.id,
            {
                onSuccess: () => {
                    toast.success("Đã xóa chuyến đi")
                    setIsCancelOpen(false)
                },
                onError: (error) => {
                    toast.error("Xóa chuyến thất bại: " + error.message)
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
                                <div className="text-xs text-muted-foreground">Cập nhật delay qua chức năng riêng</div>
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
                                Chuyến SCHEDULED cập nhật delay khởi hành, chuyến IN_PROGRESS cập nhật delay đến ga.
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
                            <Button onClick={handleDelay} disabled={isDelayPending} className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20 px-8">Xác nhận</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Cancel Action */}
                <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="justify-start h-auto py-3 border-red-500/50 hover:bg-red-50">
                            <Ban className="h-5 w-5 mr-3 text-red-600" />
                            <div className="text-left">
                                <div className="font-semibold text-red-600">Xóa chuyến đi</div>
                                <div className="text-xs text-muted-foreground">Chỉ xóa khi không vướng dữ liệu lịch sử</div>
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
                                Hành động này không thể hoàn tác. Nếu chuyến đã có dữ liệu phụ thuộc, hệ thống sẽ từ chối để giữ toàn vẹn dữ liệu.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="px-8 pb-4 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Ghi chú nội bộ</Label>
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
                            <Button variant="destructive" onClick={handleCancel} disabled={isDeleting} className="rounded-xl h-11 font-bold shadow-lg shadow-red-900/20 px-8">Xóa chuyến ngay</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
