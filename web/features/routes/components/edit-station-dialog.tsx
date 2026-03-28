
"use client"

import * as React from "react"
import { toast } from "sonner"

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

interface EditStationDialogProps {
    routeId: string;
    station: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditStationDialog({ routeId, station, open, onOpenChange, onSuccess }: EditStationDialogProps) {
    const [name, setName] = React.useState("")
    const [lat, setLat] = React.useState("")
    const [long, setLong] = React.useState("")
    const [distance, setDistance] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        if (station) {
            setName(station.station.name)
            setLat(station.station.latitude)
            setLong(station.station.longitude)
            setDistance(station.distanceFromStart)
        }
    }, [station])

    const handleSubmit = async () => {
        if (!name || !lat || !long || !distance) {
            toast.error("Vui lòng nhập đầy đủ thông tin")
            return
        }

        try {
            setLoading(true)

            await apiClient.patch(`/route/${routeId}/stations/${station.stationId}`, {
                name: name,
                latitude: parseFloat(lat),
                longitude: parseFloat(long),
                distanceFromStart: parseFloat(distance)
            })

            toast.success("Cập nhật trạm thành công")
            onSuccess()
            onOpenChange(false)

        } catch (error) {
            toast.error("Cập nhật thất bại")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px] rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Sửa thông tin trạm</DialogTitle>
                    <DialogDescription className="text-sm font-medium text-muted-foreground/50">
                        Cập nhật thông tin trạm và khoảng cách trong danh mục.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tên trạm</Label>
                        <Input 
                            className="h-11 rounded-xl bg-gray-50/50 border-gray-100" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Vĩ độ</Label>
                            <Input className="h-11 rounded-xl bg-gray-50/50 border-gray-100" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Kinh độ</Label>
                            <Input className="h-11 rounded-xl bg-gray-50/50 border-gray-100" type="number" step="any" value={long} onChange={(e) => setLong(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Khoảng cách từ ga đầu (km)</Label>
                        <Input className="h-11 rounded-xl bg-gray-50/50 border-gray-100" type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="0.0" />
                    </div>
                </div>

                <DialogFooter className="p-8">
                    <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-900/20">
                        {loading ? "Đang xử lý..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
