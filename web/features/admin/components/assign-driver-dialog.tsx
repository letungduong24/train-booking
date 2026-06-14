"use client"

import * as React from "react"
import { toast } from "sonner"
import { UserCheck, Loader2 } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDrivers, useUpdateTrip } from "@/features/trips/hooks/use-trips"

interface AssignDriverDialogProps {
    tripId: string
    currentDriverId: string | null
}

export function AssignDriverDialog({ tripId, currentDriverId }: AssignDriverDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedDriverId, setSelectedDriverId] = React.useState<string>(currentDriverId || "unassigned")
    const { data: drivers = [], isLoading: isLoadingDrivers } = useDrivers()
    const updateTrip = useUpdateTrip()

    // Sync selected driver state when currentDriverId changes or dialog opens
    React.useEffect(() => {
        if (open) {
            setSelectedDriverId(currentDriverId || "")
        }
    }, [open, currentDriverId])

    const handleAssign = () => {
        if (!selectedDriverId || selectedDriverId === "unassigned") {
            toast.error("Vui lòng chọn lái tàu")
            return
        }

        updateTrip.mutate(
            {
                id: tripId,
                data: {
                    driverId: selectedDriverId,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Phân công lái tàu thành công")
                    setOpen(false)
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi phân công")
                },
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-gray-100 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-[#802222] dark:hover:text-rose-400 transition-all flex items-center gap-2 group/btn"
                >
                    <UserCheck className="w-4 h-4 opacity-40 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all" />
                    <span className="text-xs font-bold uppercase tracking-wider">Phân công Lái tàu</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight flex items-center gap-2">
                        <UserCheck className="w-5 h-5 opacity-40 text-[#802222] dark:text-rose-400" />
                        Phân công Lái tàu điều hành
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Chọn tài xế lái tàu đảm nhận và chịu trách nhiệm điều khiển chuyến đi này.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Danh sách Lái tàu</label>
                        {isLoadingDrivers ? (
                            <div className="h-12 flex items-center justify-center bg-rose-50/10 dark:bg-zinc-900/10 border border-dashed border-rose-100/50 dark:border-zinc-800 rounded-xl">
                                <Loader2 className="w-5 h-5 animate-spin text-[#802222] dark:text-rose-400" />
                            </div>
                        ) : (
                            <Select
                                value={selectedDriverId}
                                onValueChange={setSelectedDriverId}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-rose-100/50 dark:border-zinc-800 bg-rose-50/10 dark:bg-zinc-900/10 w-full text-left">
                                    <SelectValue placeholder="Chọn lái tàu..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-950 p-1 rounded-xl">
                                    {drivers.map((driver) => (
                                        <SelectItem
                                            key={driver.id}
                                            value={driver.id}
                                            className="rounded-lg focus:bg-rose-50 focus:text-[#802222] dark:focus:bg-zinc-900"
                                        >
                                            {driver.name || "Chưa đặt tên"} ({driver.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-8 pt-4 gap-3 bg-rose-50/10 dark:bg-zinc-900/10 border-t border-rose-50/50 dark:border-zinc-900/50 flex flex-col sm:flex-row justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="rounded-xl font-bold h-11 text-xs"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAssign}
                        disabled={updateTrip.isPending || isLoadingDrivers}
                        className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20 px-6 text-xs flex items-center gap-2"
                    >
                        {updateTrip.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {updateTrip.isPending ? "Đang cập nhật..." : "Xác nhận phân công"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
