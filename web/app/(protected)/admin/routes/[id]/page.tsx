"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { Trash2, Plus, GripVertical, Save, ArrowLeft, RefreshCw, Map as MapIcon } from "lucide-react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/api-client"
import { useRoute } from "@/features/routes/hooks/use-route"
import { AddStationDialog } from "@/features/routes/components/add-station-dialog"
import { ReorderConfirmDialog } from "@/features/routes/components/reorder-confirm-dialog"
import { EditRouteDialog } from "@/features/routes/components/edit-route-dialog"
import { DeleteRouteAlert } from "@/features/routes/components/delete-route-alert"
import { translateRouteStatus, getRouteStatusColor } from "@/lib/utils/route-status"

import { useQueryClient } from "@tanstack/react-query"
import { RouteMap } from "@/features/routes/components/route-map"
import { RouteDetailSkeleton } from "@/features/routes/components/route-detail-skeleton"
import { EditRouteStationDialog } from "@/features/routes/components/edit-route-station-dialog"

function SortableRow({ id, station, onDelete, routeId, onSuccess }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: isDragging ? 'relative' : 'static' as any,
    };

    return (
        <TableRow ref={setNodeRef} style={style} className="hover:bg-rose-50/10 border-none transition-colors h-16">
            <TableCell className="pl-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-grab touch-none hover:bg-rose-50 rounded-lg text-[#802222]/30"
                    style={{ touchAction: 'none' }}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </Button>
            </TableCell>
            <TableCell className="font-bold text-zinc-500 tabular-nums">{station.index + 1}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{station.station?.name || "Unknown"}</span>
                </div>
            </TableCell>
            <TableCell className="text-zinc-500 font-medium tabular-nums text-xs">
                <div>{station.station?.latitude.toFixed(4)}, {station.station?.longitude.toFixed(4)}</div>
            </TableCell>
            <TableCell className="font-black text-[#802222] tabular-nums">{station.distanceFromStart} <span className="text-[10px] opacity-40">km</span></TableCell>
            <TableCell className="pr-6">
                <div className="flex justify-end gap-1">
                    <EditRouteStationDialog
                        routeId={routeId}
                        station={station}
                        onSuccess={onSuccess}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#802222]/30 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => onDelete(station.stationId)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

export default function RouteDetailPage() {
    const params = useParams()
    const router = useRouter()
    const routeId = params.id as string
    const queryClient = useQueryClient()

    const { data: route, isLoading, isError } = useRoute(routeId)

    const [createOpen, setCreateOpen] = React.useState(false)
    const [confirmReorderOpen, setConfirmReorderOpen] = React.useState(false)
    const [items, setItems] = React.useState<any[]>([])
    const [hasChanged, setHasChanged] = React.useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement before drag starts
            },
        }),
        useSensor(TouchSensor, {
            // Require movement before activating to allow scrolling
            activationConstraint: {
                delay: 200,
                tolerance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    React.useEffect(() => {
        if (route?.stations) {
            setItems(route.stations)
            setHasChanged(false)
        }
    }, [route])

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.stationId === active.id);
                const newIndex = items.findIndex((item) => item.stationId === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                setHasChanged(true)
                return newItems;
            });
        }
    }

    const handleRemoveStation = async (stationId: string) => {
        if (!routeId) return
        try {
            await apiClient.delete(`/route/${routeId}/stations/${stationId}`)
            toast.success("Xóa trạm thành công")
            queryClient.invalidateQueries({ queryKey: ['route', routeId] })
        } catch (error) {
            toast.error("Xóa trạm thất bại")
        }
    }

    const handleSaveOrder = () => {
        setConfirmReorderOpen(true)
    }

    const handleSuccessReorder = () => {
        queryClient.invalidateQueries({ queryKey: ['route', routeId] })
        setHasChanged(false)
    }

    const handleRecalculatePath = async () => {
        try {
            await apiClient.post(`/route/${routeId}/recalculate-path`)
            toast.success("Tính lại đường đi thành công")
            queryClient.invalidateQueries({ queryKey: ['route', routeId] })
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Tính lại đường đi thất bại"
            toast.error(msg)
        }
    }

    const handleBack = () => {
        router.push('/admin/routes')
    }

    const handleRouteDeleted = () => {
        router.push('/admin/routes')
    }

    if (isLoading) return <RouteDetailSkeleton />
    if (isError || !route) return <div>Route not found</div>

    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full hover:bg-rose-50 hover:text-[#802222]">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Chi tiết tuyến đường</h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">{route.name}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRecalculatePath}
                        className="rounded-xl border-gray-100 dark:border-zinc-800 hover:bg-rose-50 font-bold"
                        title="Tính lại đường đi theo đường ray"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tính lại đường
                    </Button>
                    <EditRouteDialog route={route} />
                    <DeleteRouteAlert
                        route={route}
                        onSuccess={handleRouteDeleted}
                        currentPage={1}
                        totalItems={1}
                        itemsPerPage={10}
                        itemsOnCurrentPage={1}
                        onNavigateToPreviousPage={() => { }}
                    />
                </div>
            </div>

            {/* New Horizontal Route Metrics Bar */}
            <div className="rounded-[2.5rem] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] p-6 relative group">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-center lg:justify-between gap-8 px-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-[#802222] dark:text-rose-400">
                            <MapIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Thông số tuyến</h4>
                            <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest mt-1">Thông tin vận hành thực tế</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 flex-1 lg:justify-end">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Trạng thái</span>
                            <Badge variant={getRouteStatusColor(route.status)} className="rounded-lg px-3 py-1 text-[10px] font-bold">
                                {translateRouteStatus(route.status)}
                            </Badge>
                        </div>
                        
                        <div className="space-y-0.5 sm:border-l sm:border-gray-50 sm:dark:border-zinc-800/50 sm:pl-8 lg:pl-12">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Thời gian chạy</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#802222] tabular-nums tracking-tighter">
                                    {Math.floor(route.durationMinutes / 60)}<span className="text-xs font-bold opacity-40 ml-0.5">h</span> {route.durationMinutes % 60}
                                </span>
                                <span className="text-xs font-bold text-[#802222]/40 tracking-tighter uppercase">phút</span>
                            </div>
                        </div>

                        <div className="space-y-0.5 sm:border-l sm:border-gray-50 sm:dark:border-zinc-800/50 sm:pl-8 lg:pl-12">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cự ly ước tính</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#802222] tabular-nums tracking-tighter">
                                    {items.length > 0 ? items[items.length - 1].distanceFromStart : 0}
                                </span>
                                <span className="text-xs font-bold text-[#802222]/40 tracking-tighter uppercase">km</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-width Map Card */}
            <div className="rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] min-h-[500px] relative group">
                <RouteMap stations={items} pathCoordinates={route.pathCoordinates} />
                <div className="absolute top-6 left-6 z-10">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#802222] animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#802222]/80">Trực quan lộ trình</span>
                    </div>
                </div>
            </div>

            {/* Full-width Stations Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Hành trình chi tiết</h3>
                    <div className="flex gap-2">
                        {hasChanged && (
                            <Button onClick={handleSaveOrder} size="sm" variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-xl font-bold">
                                <Save className="mr-2 h-4 w-4" /> Lưu thứ tự
                            </Button>
                        )}
                        <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl font-bold px-6">
                            <Plus className="mr-2 h-4 w-4" /> Thêm trạm dừng
                        </Button>
                    </div>
                </div>

                <div className="rounded-[2.5rem] border-none bg-white dark:bg-zinc-900 overflow-hidden shadow-none">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <Table>
                            <TableHeader className="bg-rose-50/20 dark:bg-zinc-800/20">
                                <TableRow className="hover:bg-transparent border-none h-16">
                                    <TableHead className="w-[60px]"></TableHead>
                                    <TableHead className="w-[80px] text-xs font-bold uppercase tracking-widest text-[#802222]/50 pl-6">TT</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50">Tên ga dừng</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50">Tọa độ địa lý</TableHead>
                                    <TableHead className="text-xs font-bold uppercase tracking-widest text-[#802222]/50">Cự ly từ ga đầu</TableHead>
                                    <TableHead className="w-[120px] pr-6 text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <SortableContext
                                    items={items.map(i => i.stationId)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {items.length > 0 ? (
                                        items.map((item: any) => (
                                            <SortableRow
                                                key={item.stationId}
                                                id={item.stationId}
                                                station={item}
                                                onDelete={handleRemoveStation}
                                                routeId={routeId}
                                                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['route', routeId] })}
                                            />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                                                Chưa có dữ liệu hành trình.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </SortableContext>
                            </TableBody>
                        </Table>
                    </DndContext>
                </div>
            </div>

            <AddStationDialog
                routeId={routeId}
                currentStationCount={items.length}
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['route', routeId] })}
            />

            <ReorderConfirmDialog
                routeId={routeId}
                stations={items}
                open={confirmReorderOpen}
                onOpenChange={setConfirmReorderOpen}
                onSuccess={handleSuccessReorder}
            />
        </div>
    )
}
