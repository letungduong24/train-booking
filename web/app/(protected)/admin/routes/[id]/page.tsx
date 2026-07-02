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
import { useUpdateRoute } from "@/features/routes/hooks/use-route-mutations"
import { useAvailableStations } from "@/features/routes/hooks/use-available-stations"
import { EditRouteDialog } from "@/features/routes/components/edit-route-dialog"
import { DeleteRouteAlert } from "@/features/routes/components/delete-route-alert"
import { translateRouteStatus, getRouteStatusColor } from "@/lib/utils/route-status"

import { useQueryClient } from "@tanstack/react-query"
import { RouteMap } from "@/features/routes/components/route-map"
import { RouteDetailSkeleton } from "@/features/routes/components/route-detail-skeleton"

function SortableRow({ id, station, arrayIndex, onDelete }: any) {
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
            <TableCell className="font-bold text-zinc-500 tabular-nums">{arrayIndex + 1}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{station.station?.name || "Unknown"}</span>
                </div>
            </TableCell>
            <TableCell className="text-zinc-500 font-medium tabular-nums text-xs">
                <div>{station.station?.latitude.toFixed(4)}, {station.station?.longitude.toFixed(4)}</div>
            </TableCell>
            <TableCell className="font-black text-[#802222] tabular-nums">
                {station.distanceFromStart === -1 || station.distanceFromStart == null ? (
                    <span className="text-muted-foreground font-normal">-</span>
                ) : (
                    <>{station.distanceFromStart} <span className="text-[10px] opacity-40">km</span></>
                )}
            </TableCell>
            <TableCell className="pr-6">
                <div className="flex justify-end gap-1">
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
    const [items, setItems] = React.useState<any[]>([])
    const [hasChanged, setHasChanged] = React.useState(false)
    
    const updateRoute = useUpdateRoute()

    const { data: availableData } = useAvailableStations({
        routeId,
        page: 1,
        limit: 100,
    })
    const availableStations = availableData?.data || []

    const actualAvailableStations = React.useMemo(() => {
        const localItemsIds = new Set(items.map(item => item.stationId));
        const locallyRemovedStations = (route?.stations || [])
            .filter((rs: any) => rs.station && !localItemsIds.has(rs.stationId))
            .map((rs: any) => rs.station);
        return [...availableStations, ...locallyRemovedStations];
    }, [availableStations, items, route?.stations]);

    const handleAddStationFromMap = (candidate: { id: string; name: string; latitude: number; longitude: number }) => {
        const nextIndex = items.length;
        const lastDistance = items.length > 0 ? items[items.length - 1].distanceFromStart : 0;
        const newItem = {
            stationId: candidate.id,
            index: nextIndex,
            distanceFromStart: -1, // -1 means uncalculated
            station: candidate
        };
        setItems(prev => [...prev, newItem]);
        setHasChanged(true);
        toast.success(`Đã thêm ga ${candidate.name} vào lộ trình`);
    }

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
        if (route?.stations && !hasChanged) {
            setItems(route.stations)
        }
    }, [route, hasChanged])

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.stationId === active.id);
                const newIndex = items.findIndex((item) => item.stationId === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                
                // Distances are no longer valid after reorder
                const updatedItems = newItems.map(item => ({
                    ...item,
                    distanceFromStart: -1
                }));
                
                setHasChanged(true)
                return updatedItems;
            });
        }
    }

    const handleRemoveStation = (stationId: string) => {
        setItems((prev) => prev.filter(s => s.stationId !== stationId).map(item => ({
            ...item,
            distanceFromStart: -1 // Distances change when a station is removed
        })))
        setHasChanged(true)
    }

    const handleAddStationLocally = (stationData: { id: string, name: string, latitude: number, longitude: number }) => {
        setItems(prev => [
            ...prev,
            {
                routeId,
                stationId: stationData.id,
                index: prev.length,
                distanceFromStart: -1,
                station: stationData
            }
        ])
        setHasChanged(true)
    }

    const handleSaveChanges = () => {
        if (!route) return;
        const payload = items.map(s => ({
            id: s.stationId
        }))
        const newName = items.length > 1 ? `${items[0].station?.name} - ${items[items.length - 1].station?.name}` : route.name;

        updateRoute.mutate({ id: routeId, data: { stations: payload, name: newName } }, {
            onSuccess: (newRoute) => {
                setHasChanged(false)
                // If it created a new version, redirect to it
                if (newRoute.id !== routeId) {
                    router.push(`/admin/routes/${newRoute.id}`)
                }
            }
        })
    }

    const handleBack = () => {
        router.push('/admin/routes')
    }

    const handleRouteDeleted = () => {
        router.push('/admin/routes')
    }

    if (isLoading) return <RouteDetailSkeleton />
    if (isError || !route) return <div>Không tìm thấy tuyến đường</div>

    const routeName = items.length > 1 ? `${items[0].station?.name} - ${items[items.length - 1].station?.name}` : route.name;

    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500 pb-24">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full hover:bg-rose-50 hover:text-[#802222]">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Chi tiết tuyến đường</h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">{routeName}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8 flex-1 lg:justify-end">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Phiên bản</span>
                            <Badge variant="outline" className="rounded-lg px-3 py-1 text-[10px] font-black bg-rose-50 dark:bg-rose-950/30 text-[#802222] dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30">
                                v{route.version || 1}
                            </Badge>
                        </div>

                        <div className="space-y-1 sm:border-l sm:border-gray-50 sm:dark:border-zinc-800/50 sm:pl-6 lg:pl-8">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Trạng thái</span>
                            <Badge variant={getRouteStatusColor(route.status)} className="rounded-lg px-3 py-1 text-[10px] font-bold">
                                {translateRouteStatus(route.status)}
                            </Badge>
                        </div>
                        
                        <div className="space-y-0.5 sm:border-l sm:border-gray-50 sm:dark:border-zinc-800/50 sm:pl-6 lg:pl-8">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Thời gian chạy</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#802222] tabular-nums tracking-tighter">
                                    {Math.floor(route.durationMinutes / 60)}<span className="text-xs font-bold opacity-40 ml-0.5">h</span> {route.durationMinutes % 60}
                                </span>
                                <span className="text-xs font-bold text-[#802222]/40 tracking-tighter uppercase">phút</span>
                            </div>
                        </div>

                        <div className="space-y-0.5 sm:border-l sm:border-gray-50 sm:dark:border-zinc-800/50 sm:pl-6 lg:pl-8">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Cự ly ước tính</span>
                            <div className="flex items-baseline gap-1">
                                {items.length > 0 && items[items.length - 1].distanceFromStart !== -1 ? (
                                    <>
                                        <span className="text-2xl font-black text-[#802222] tabular-nums tracking-tighter">
                                            {items[items.length - 1].distanceFromStart}
                                        </span>
                                        <span className="text-xs font-bold text-[#802222]/40 tracking-tighter uppercase">km</span>
                                    </>
                                ) : (
                                    <span className="text-2xl font-black text-muted-foreground tabular-nums tracking-tighter">
                                        -
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-width Map Card */}
            <div className="rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] min-h-[500px] relative group">
                <RouteMap 
                    stations={items} 
                    pathCoordinates={route.pathCoordinates} 
                    availableStations={actualAvailableStations}
                    onAddStationClick={handleAddStationFromMap}
                />
                <div className="absolute top-6 left-6 z-10">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#802222] animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#802222]/80">Trực quan lộ trình</span>
                    </div>
                </div>
                <div className="absolute top-6 right-6 z-10 pointer-events-none">
                    <div className="bg-zinc-900/90 text-white backdrop-blur-md px-4 py-2 rounded-xl shadow-md text-xs font-medium">
                        💡 <span className="opacity-90">Nhấn vào các mốc ga xám trên bản đồ để thêm vào lộ trình</span>
                    </div>
                </div>
            </div>

            {/* Full-width Stations Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Hành trình chi tiết</h3>
                    <span className="text-xs text-muted-foreground/60 italic">Kéo thả để sắp xếp lại thứ tự ga dừng</span>
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
                                    <TableHead className="w-[80px] pr-6 text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <SortableContext
                                    items={items.map(i => i.stationId)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {items.length > 0 ? (
                                        items.map((item: any, index: number) => (
                                            <SortableRow
                                                key={item.stationId}
                                                id={item.stationId}
                                                station={item}
                                                arrayIndex={index}
                                                onDelete={handleRemoveStation}
                                            />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                                                Chưa có dữ liệu hành trình. Vui lòng chọn ga từ bản đồ phía trên.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </SortableContext>
                                </TableBody>
                        </Table>
                    </DndContext>
                </div>
            </div>

            {/* Floating Save Changes Bar */}
            {hasChanged && (
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-rose-100 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex items-center justify-between px-8 animate-in slide-in-from-bottom-full duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                            <Save className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-900 dark:text-white">Bạn có thay đổi chưa lưu</h4>
                            <p className="text-xs font-medium text-muted-foreground">Nhấn lưu để áp dụng các thay đổi cho tuyến đường này</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setItems(route?.stations || [])
                                setHasChanged(false)
                            }}
                            className="rounded-xl font-bold hover:bg-zinc-100"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleSaveChanges}
                            disabled={updateRoute.isPending}
                            className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl font-bold px-8 shadow-lg shadow-rose-900/20"
                        >
                            {updateRoute.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
