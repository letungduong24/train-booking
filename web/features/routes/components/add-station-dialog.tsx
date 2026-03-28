"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"

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
    latitude: z.number(),
    longitude: z.number(),
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
            latitude: 0,
            longitude: 0,
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
                    latitude: values.latitude,
                    longitude: values.longitude
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
            <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8 flex flex-col">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Thêm trạm vào tuyến</DialogTitle>
                    <DialogDescription className="text-sm font-medium text-muted-foreground/50">
                        Tạo trạm mới hoặc chọn từ danh sách có sẵn.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="create" className="flex flex-col px-8">
                    <TabsList className="grid w-full grid-cols-2 bg-rose-50/50 dark:bg-rose-950/20 p-1 rounded-xl h-12">
                        <TabsTrigger value="create" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#802222] data-[state=active]:shadow-sm transition-all h-10">Tạo mới</TabsTrigger>
                        <TabsTrigger value="select" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#802222] data-[state=active]:shadow-sm transition-all h-10">Chọn có sẵn</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="flex-1 overflow-auto">
                        <form onSubmit={form.handleSubmit(handleCreateAndAdd)} className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tên trạm</Label>
                                    <Input
                                        className="col-span-3 h-11 rounded-xl bg-gray-50/50 border-gray-100"
                                        {...form.register("name")}
                                        placeholder="Ví dụ: Bến xe Mỹ Đình"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Vĩ độ</Label>
                                    <Input
                                        className="col-span-3 h-11 rounded-xl bg-gray-50/50 border-gray-100"
                                        type="number"
                                        step="any"
                                        {...form.register("latitude", { valueAsNumber: true })}
                                        placeholder="21.0285"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Kinh độ</Label>
                                    <Input
                                        className="col-span-3 h-11 rounded-xl bg-gray-50/50 border-gray-100"
                                        type="number"
                                        step="any"
                                        {...form.register("longitude", { valueAsNumber: true })}
                                        placeholder="105.8542"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Cự ly (km)</Label>
                                    <Input
                                        className="col-span-3 h-11 rounded-xl bg-gray-50/50 border-gray-100"
                                        type="number"
                                        step="0.1"
                                        {...form.register("distanceFromStart", { valueAsNumber: true })}
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="py-6">
                                <Button type="submit" disabled={loading} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20">
                                    {loading ? "Đang xử lý..." : "Tạo và Thêm"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="select" className="mt-6 flex flex-col gap-4">
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    placeholder="Tìm kiếm trạm..."
                                    value={searchValue}
                                    onChange={(e) => {
                                        setSearchValue(e.target.value)
                                        setPage(1) // Reset to page 1 on search
                                    }}
                                    className="h-11 rounded-xl bg-gray-50/50 border-gray-100 pl-4"
                                />
                            </div>

                            <ScrollArea className="border border-gray-100 rounded-[1.5rem] bg-gray-50/30 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-rose-50/50 hover:bg-rose-50/50 border-gray-100">
                                            <TableHead className="font-bold text-[#802222] uppercase tracking-wider text-[10px]">Tên trạm</TableHead>
                                            <TableHead className="font-bold text-[#802222] uppercase tracking-wider text-[10px]">Vị trí</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stations.length > 0 ? (
                                            stations.map((station) => (
                                                <TableRow key={station.id} className="border-gray-100/50 hover:bg-rose-50/30 transition-colors">
                                                    <TableCell className="font-semibold text-zinc-900">{station.name}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                                                        {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            variant={selectedStation?.id === station.id ? "default" : "outline"}
                                                            onClick={() => setSelectedStation(station)}
                                                            className={selectedStation?.id === station.id 
                                                                ? "bg-[#802222] hover:bg-rose-900 text-white rounded-lg shadow-sm border-none" 
                                                                : "rounded-lg border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-[#802222] hover:border-[#802222]/30"}
                                                        >
                                                            {selectedStation?.id === station.id ? "Đã chọn" : "Chọn"}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
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
                                        className="h-9 px-4 rounded-xl border-gray-100 hover:bg-rose-50 hover:text-[#802222] font-semibold text-xs transition-colors"
                                    >
                                        Trước
                                    </Button>
                                    <div className="flex items-center px-2 text-xs font-bold text-zinc-500 tabular-nums">
                                        {meta.page} / {meta.totalPages || 1}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= meta.totalPages}
                                        className="h-9 px-4 rounded-xl border-gray-100 hover:bg-rose-50 hover:text-[#802222] font-semibold text-xs transition-colors"
                                    >
                                        Tiếp
                                    </Button>
                                </div>
                            </div>

                            {selectedStation && (
                                <div className="border border-rose-100 p-6 rounded-[1.5rem] space-y-4 bg-rose-50/30 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-[#802222]">Đã chọn: {selectedStation.name}</p>
                                            <p className="text-xs font-medium text-rose-900/50 mt-1">Trạm số {nextIndex + 1} trong tuyến</p>
                                        </div>
                                        <Badge variant="outline" className="bg-white border-rose-200 text-[#802222] rounded-lg px-2 py-0.5">Sẵn sàng</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/50">Khoảng cách từ ga đầu (km)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={distance}
                                            onChange={(e) => setDistance(e.target.value)}
                                            placeholder="0.0"
                                            className="h-11 rounded-xl bg-white border-rose-100 focus-visible:ring-rose-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="pt-2 pb-8">
                                <Button onClick={handleSelectAndAdd} disabled={loading || !selectedStation} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-900/20">
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
