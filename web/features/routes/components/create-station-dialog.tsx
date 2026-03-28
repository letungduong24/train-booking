
"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import apiClient from "@/lib/api-client"
import { useRoutesStore } from "@/lib/store/routes.store"

interface CreateStationDialogProps {
    routeId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface Station {
    id: string;
    name: string;
}

export function CreateStationDialog({ routeId, open, onOpenChange, onSuccess }: CreateStationDialogProps) {
    const [name, setName] = React.useState("")
    const [lat, setLat] = React.useState("")
    const [long, setLong] = React.useState("")
    const [index, setIndex] = React.useState("")
    const [distance, setDistance] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    const handleSubmit = async () => {
        if (!name || !lat || !long || !index || !distance) {
            toast.error("Vui lòng nhập đầy đủ thông tin")
            return
        }

        try {
            setLoading(true)

            // 1. Create Station
            let stationId = "";
            try {
                const res = await apiClient.post<Station>('/station', {
                    name: name,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(long)
                })
                stationId = res.data.id
            } catch (err: any) {
                if (err.response && err.response.status === 409) {
                    toast.error("Tên trạm đã tồn tại")
                } else {
                    toast.error("Lỗi khi tạo trạm")
                }
                setLoading(false)
                return
            }

            // 2. Add to Route
            await apiClient.post(`/route/${routeId}/stations`, {
                stationId: stationId,
                index: parseInt(index),
                distanceFromStart: parseFloat(distance)
            })

            toast.success("Thêm trạm thành công")
            onSuccess()
            onOpenChange(false)

            // Reset form
            setName("")
            setLat("")
            setLong("")
            setIndex("")
            setDistance("")

        } catch (error: any) {
            if (error.response && error.response.status === 409) {
                toast.error(error.response.data.message || "Lỗi conflict")
            } else {
                toast.error("Thêm trạm vào tuyến thất bại")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Thêm trạm mới vào tuyến</DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Nhập thông tin trạm và vị trí trong tuyến đường.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 pb-8 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Tên trạm</Label>
                        <Input className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên trạm..." />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Vĩ độ</Label>
                            <Input className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Kinh độ</Label>
                            <Input className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800" type="number" step="any" value={long} onChange={(e) => setLong(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Thứ tự (Index)</Label>
                            <Input className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800" type="number" value={index} onChange={(e) => setIndex(e.target.value)} placeholder="0, 1, 2..." />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider ml-1">Khoảng cách (km)</Label>
                            <Input className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800" type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="km" />
                        </div>
                    </div>

                    <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-900/20 mt-4">
                        {loading ? "Đang xử lý..." : "Tạo và Thêm trạm"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
