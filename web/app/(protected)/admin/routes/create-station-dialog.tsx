
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
                    latitute: parseFloat(lat),
                    longtitute: parseFloat(long)
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Thêm trạm mới vào tuyến</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin trạm và vị trí trong tuyến đường.
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
                        <Label className="text-right">Thứ tự (Index)</Label>
                        <Input className="col-span-3" type="number" value={index} onChange={(e) => setIndex(e.target.value)} placeholder="0, 1, 2..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Khoảng cách</Label>
                        <Input className="col-span-3" type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="km" />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang xử lý..." : "Tạo và Thêm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
