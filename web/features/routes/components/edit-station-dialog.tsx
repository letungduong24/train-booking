
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
            setLat(station.station.latitute)
            setLong(station.station.longtitute)
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
                latitute: parseFloat(lat),
                longtitute: parseFloat(long),
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Sửa thông tin trạm</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin trạm và khoảng cách.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Tên trạm</Label>
                        <Input className="col-span-3" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Vĩ độ</Label>
                        <Input className="col-span-3" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Kinh độ</Label>
                        <Input className="col-span-3" type="number" step="any" value={long} onChange={(e) => setLong(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Khoảng cách</Label>
                        <Input className="col-span-3" type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="km" />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang xử lý..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
