
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useReorderStations } from "@/features/routes/hooks/use-route-mutations"

interface ReorderConfirmDialogProps {
    routeId: string;
    stations: any[]; // The reordered list
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ReorderConfirmDialog({ routeId, stations, open, onOpenChange, onSuccess }: ReorderConfirmDialogProps) {
    const [distances, setDistances] = React.useState<Record<string, string>>({})
    const reorderStations = useReorderStations()

    // Reset distances to 0 when dialog opens
    React.useEffect(() => {
        if (open && stations.length > 0) {
            const initialDistances: Record<string, string> = {}
            stations.forEach(s => {
                initialDistances[s.stationId] = "0"
            })
            setDistances(initialDistances)
        }
    }, [open, stations])

    const handleDistanceChange = (stationId: string, value: string) => {
        setDistances(prev => ({
            ...prev,
            [stationId]: value
        }))
    }

    const handleSubmit = async () => {
        // Validate and prepare payload
        const payload = stations.map(item => {
            const dist = parseFloat(distances[item.stationId] || "0")
            return {
                stationId: item.stationId,
                distanceFromStart: dist
            }
        })

        reorderStations.mutate(
            { routeId, stations: payload },
            {
                onSuccess: () => {
                    onSuccess()
                    onOpenChange(false)
                }
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Xác nhận thứ tự mới</DialogTitle>
                    <DialogDescription>
                        Thứ tự trạm đã thay đổi. Vui lòng cập nhật lại khoảng cách cho tất cả các trạm theo thứ tự mới.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4 py-4">
                        {stations.map((item, index) => (
                            <div key={item.stationId} className="grid grid-cols-4 items-center gap-4 border-b pb-2">
                                <div className="col-span-2">
                                    <span className="font-bold mr-2 text-muted-foreground">#{index + 1}</span>
                                    <span>{item.station?.name}</span>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={distances[item.stationId] || ""}
                                        onChange={(e) => handleDistanceChange(item.stationId, e.target.value)}
                                        placeholder="0.0"
                                    />
                                    <span className="text-sm text-muted-foreground">km</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={reorderStations.isPending}>
                        {reorderStations.isPending ? "Đang xử lý..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
