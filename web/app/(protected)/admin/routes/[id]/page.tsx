"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { Trash2, Plus, GripVertical, Save, ArrowLeft } from "lucide-react"
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
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
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
        <TableRow ref={setNodeRef} style={style}>
            <TableCell>
                <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-grab touch-none"
                    style={{ touchAction: 'none' }}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </Button>
            </TableCell>
            <TableCell>{station.index + 1}</TableCell>
            <TableCell className="font-medium">{station.station?.name || "Unknown"}</TableCell>
            <TableCell>{station.station?.latitute}</TableCell>
            <TableCell>{station.station?.longtitute}</TableCell>
            <TableCell>{station.distanceFromStart}</TableCell>
            <TableCell className="flex gap-2">
                <EditRouteStationDialog
                    routeId={routeId}
                    station={station}
                    onSuccess={onSuccess}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(station.stationId)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
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

    const handleBack = () => {
        router.push('/admin/routes')
    }

    const handleRouteDeleted = () => {
        router.push('/admin/routes')
    }

    if (isLoading) return <RouteDetailSkeleton />
    if (isError || !route) return <div>Route not found</div>

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">Chi tiết tuyến đường</h1>
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

                    <div className="flex-1 space-y-6">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b pb-4 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">{route.name}</h2>
                                <p className="text-muted-foreground mt-1">
                                    Quản lý danh sách trạm dừng
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <EditRouteDialog route={route} />
                                <DeleteRouteAlert
                                    route={route}
                                    onSuccess={handleRouteDeleted}
                                    // Pass dummy values as we are in detail page and just want to redirect
                                    currentPage={1}
                                    totalItems={1}
                                    itemsPerPage={10}
                                    itemsOnCurrentPage={1}
                                    onNavigateToPreviousPage={() => { }}
                                />
                            </div>
                        </div>

                        {/* Route Info */}
                        <div className="flex flex-wrap justify-between gap-4 border p-4 rounded-md bg-muted/20">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Trạng thái:</span>
                                <Badge variant={getRouteStatusColor(route.status)}>{translateRouteStatus(route.status)}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Ngày tạo:</span>
                                <span>{format(new Date(route.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Thời gian chạy:</span>
                                <span>{Math.floor(route.durationMinutes / 60)}g{route.durationMinutes % 60 > 0 ? ` ${route.durationMinutes % 60}p` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Nghỉ quay đầu:</span>
                                <span>{Math.floor(route.turnaroundMinutes / 60)}g{route.turnaroundMinutes % 60 > 0 ? ` ${route.turnaroundMinutes % 60}p` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Giá/km:</span>
                                <span className="font-medium">{route.basePricePerKm.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Phí bến:</span>
                                <span className="font-medium">{route.stationFee.toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="rounded-md border overflow-hidden">
                            <RouteMap stations={items} />
                        </div>

                        {/* Stations Table */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Danh sách trạm</h3>
                                <div className="flex gap-2">
                                    {hasChanged && (
                                        <Button onClick={handleSaveOrder} size="sm" variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                            <Save className="mr-2 h-4 w-4" /> Lưu thứ tự
                                        </Button>
                                    )}
                                    <Button onClick={() => setCreateOpen(true)} size="sm">
                                        <Plus className="mr-2 h-4 w-4" /> Thêm trạm
                                    </Button>
                                </div>
                            </div>
                            <div className="rounded-md border">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[30px]"></TableHead>
                                                <TableHead className="w-[50px]">TT</TableHead>
                                                <TableHead>Tên trạm</TableHead>
                                                <TableHead>Vĩ độ</TableHead>
                                                <TableHead>Kinh độ</TableHead>
                                                <TableHead>Khoảng cách (km)</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
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
                                                            onDelete={handleRemoveStation}
                                                            routeId={routeId}
                                                            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['route', routeId] })}
                                                        />
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                            Chưa có trạm nào. Nhấn "Thêm trạm" để bắt đầu.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </SortableContext>
                                        </TableBody>
                                    </Table>
                                </DndContext>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
