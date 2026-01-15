"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import apiClient from "@/lib/api-client"
import { useAvailableStations } from "@/features/routes/hooks/use-available-stations"
import { Station } from "@/lib/schemas/station.schema"

interface AddStationDialogProps {
    routeId: string;
    currentStationCount: number; // Number of stations currently in the route
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const addStationSchema = z.object({
    name: z.string().min(1, "Tên trạm không được để trống"),
    latitute: z.number(),
    longtitute: z.number(),
    distanceFromStart: z.number().min(0),
})

export function AddStationDialog({ routeId, currentStationCount, open, onOpenChange, onSuccess }: AddStationDialogProps) {
    const queryClient = useQueryClient()
    const [loading, setLoading] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")
    const [selectedStation, setSelectedStation] = React.useState<Station | null>(null)
    const [distance, setDistance] = React.useState("")
    const [page, setPage] = React.useState(1)

    // Auto-calculate next index
    const nextIndex = currentStationCount

    const { data: stationData } = useAvailableStations({
        routeId,
        page,
        limit: 5,
        search: searchValue
    })
    const stations = stationData?.data || []
    const meta = stationData?.meta || { total: 0, page: 1, limit: 5, totalPages: 0 }

    const form = useForm<z.infer<typeof addStationSchema>>({
        resolver: zodResolver(addStationSchema),
        defaultValues: {
            name: "",
            latitute: 0,
            longtitute: 0,
            distanceFromStart: 0,
        },
    })

    const handleCreateAndAdd = async (values: z.infer<typeof addStationSchema>) => {
        try {
            setLoading(true)

            // 1. Create Station
            let stationId = "";
            try {
                const res = await apiClient.post<Station>('/station', {
                    name: values.name,
                    latitute: values.latitute,
                    longtitute: values.longtitute
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
                index: nextIndex,
                distanceFromStart: values.distanceFromStart
            })

            // 3. Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['routes'] })
            queryClient.invalidateQueries({ queryKey: ['available-stations'] })

            toast.success("Thêm trạm thành công")
            onSuccess()
            onOpenChange(false)
            form.reset()

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

    const handleSelectAndAdd = async () => {
        if (!selectedStation || !distance) {
            toast.error("Vui lòng chọn trạm và nhập đầy đủ thông tin")
            return
        }

        try {
            setLoading(true)
            await apiClient.post(`/route/${routeId}/stations`, {
                stationId: selectedStation.id,
                index: nextIndex,
                distanceFromStart: parseFloat(distance)
            })

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['routes'] })
            queryClient.invalidateQueries({ queryKey: ['available-stations'] })

            toast.success("Thêm trạm thành công")
            onSuccess()
            onOpenChange(false)
            setSelectedStation(null)
            setDistance("")

        } catch (error: any) {
            if (error.response && error.response.status === 409) {
                toast.error(error.response.data.message || "Trạm đã tồn tại trong tuyến")
            } else {
                toast.error("Thêm trạm vào tuyến thất bại")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle>Thêm trạm vào tuyến</DialogTitle>
                    <DialogDescription>
                        Tạo trạm mới hoặc chọn từ danh sách có sẵn
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="create" className="flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Tạo mới</TabsTrigger>
                        <TabsTrigger value="select">Chọn có sẵn</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="flex-1 overflow-auto">
                        <form onSubmit={form.handleSubmit(handleCreateAndAdd)} className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Tên trạm</Label>
                                    <Input
                                        className="col-span-3"
                                        {...form.register("name")}
                                        placeholder="Ví dụ: Bến xe Mỹ Đình"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Vĩ độ</Label>
                                    <Input
                                        className="col-span-3"
                                        type="number"
                                        step="any"
                                        {...form.register("latitute", { valueAsNumber: true })}
                                        placeholder="21.0285"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Kinh độ</Label>
                                    <Input
                                        className="col-span-3"
                                        type="number"
                                        step="any"
                                        {...form.register("longtitute", { valueAsNumber: true })}
                                        placeholder="105.8542"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Khoảng cách (km)</Label>
                                    <Input
                                        className="col-span-3"
                                        type="number"
                                        step="0.1"
                                        {...form.register("distanceFromStart", { valueAsNumber: true })}
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Đang xử lý..." : "Tạo và Thêm"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="select">
                        <div className="space-y-4">
                            <Input
                                placeholder="Tìm kiếm trạm..."
                                value={searchValue}
                                onChange={(e) => {
                                    setSearchValue(e.target.value)
                                    setPage(1) // Reset to page 1 on search
                                }}
                            />

                            <ScrollArea className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tên trạm</TableHead>
                                            <TableHead>Vĩ độ</TableHead>
                                            <TableHead>Kinh độ</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stations.length > 0 ? (
                                            stations.map((station) => (
                                                <TableRow key={station.id}>
                                                    <TableCell className="font-medium">{station.name}</TableCell>
                                                    <TableCell>{station.latitute}</TableCell>
                                                    <TableCell>{station.longtitute}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            variant={selectedStation?.id === station.id ? "default" : "outline"}
                                                            onClick={() => setSelectedStation(station)}
                                                        >
                                                            {selectedStation?.id === station.id ? "Đã chọn" : "Chọn"}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    Không có trạm khả dụng
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>

                            {/* Pagination */}
                            {/* Pagination */}
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                                <div className="text-sm text-muted-foreground text-center sm:text-left">
                                    {stations.length} / {meta.total} trạm
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="h-8 px-2"
                                    >
                                        Trước
                                    </Button>
                                    <div className="flex items-center px-2 text-sm whitespace-nowrap">
                                        {meta.page} / {meta.totalPages || 1}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= meta.totalPages}
                                        className="h-8 px-2"
                                    >
                                        Tiếp
                                    </Button>
                                </div>
                            </div>

                            {selectedStation && (
                                <div className="border p-4 rounded-md space-y-3 bg-muted/20">
                                    <p className="font-semibold">Đã chọn: {selectedStation.name}</p>
                                    <p className="text-sm text-muted-foreground">Thứ tự: {nextIndex + 1}</p>
                                    <div>
                                        <Label>Khoảng cách (km)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={distance}
                                            onChange={(e) => setDistance(e.target.value)}
                                            placeholder="0.0"
                                        />
                                    </div>
                                </div>
                            )}

                            <DialogFooter>
                                <Button onClick={handleSelectAndAdd} disabled={loading || !selectedStation}>
                                    {loading ? "Đang xử lý..." : "Thêm vào tuyến"}
                                </Button>
                            </DialogFooter>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog >
    )
}
