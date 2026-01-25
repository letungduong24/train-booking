"use client"

import * as React from "react"
import { use, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Coach } from "@/lib/schemas/coach.schema"
import { Seat } from "@/lib/schemas/seat.schema"
import { useTrain } from "@/features/trains/hooks/use-trains"
import { useReorderCoaches, useCoachDetail } from "@/features/trains/hooks/use-coach-mutations"
import { SeatLayoutViewer } from "@/features/trains/components/seat-layout-viewer"
import { BedLayoutViewer } from "@/features/trains/components/bed-layout-viewer"
import { AdminSeatDetailDialog } from "@/features/trains/components/admin-seat-detail-dialog"
import { CreateCoachDialog } from "@/features/trains/components/create-coach-dialog"
import { ToggleCoachStatusButton } from "@/features/trains/components/toggle-coach-status-button"
import { DeleteCoachAlert } from "@/features/trains/components/delete-coach-alert"
import { EditTrainDialog } from "@/features/trains/components/edit-train-dialog"
import { DeleteTrainAlert } from "@/features/trains/components/delete-train-alert"
import { SortableCoachItem } from "@/features/trains/components/sortable-coach-item"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
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
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
// Icons
import {
    ArrowLeft,
    Edit,
    Trash2,
    Settings,
    TrainFront
} from "lucide-react"

export default function AdminTrainDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const queryClient = useQueryClient()

    // Fetch train data with coaches
    const { data: train, isLoading, error } = useTrain(id)
    const reorderCoaches = useReorderCoaches()

    // State
    const [coaches, setCoaches] = useState<Coach[]>([])
    const [selectedCoachId, setSelectedCoachId] = useState<string>("")
    const [isSeatDialogOpen, setIsSeatDialogOpen] = useState(false)
    const [selectedSeatForAdmin, setSelectedSeatForAdmin] = useState<Seat | null>(null)

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Sync coaches from train data
    React.useEffect(() => {
        if (train?.coaches) {
            setCoaches(train.coaches)
        }
    }, [train])

    // Set initial selected coach when data loads
    React.useEffect(() => {
        if (coaches.length > 0 && !selectedCoachId) {
            setSelectedCoachId(coaches[0].id)
        }
    }, [coaches, selectedCoachId])

    // Get selected coach (without seats)
    const selectedCoach = useMemo(() =>
        coaches?.find(c => c.id === selectedCoachId),
        [coaches, selectedCoachId]
    )

    // Lazy load full coach detail with seats only when selected
    const { data: selectedCoachDetail, isLoading: isLoadingCoachDetail } = useCoachDetail(selectedCoachId)

    // Handle drag end
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = coaches.findIndex((item) => item.id === active.id);
            const newIndex = coaches.findIndex((item) => item.id === over.id);
            const newItems = arrayMove(coaches, oldIndex, newIndex);

            // Optimistically update UI
            setCoaches(newItems);

            // Call reorder API only once
            try {
                await reorderCoaches.mutateAsync({
                    trainId: id,
                    coaches: newItems.map(c => ({ coachId: c.id }))
                });
                toast.success("Đã cập nhật thứ tự toa");

                // Refetch train data to get updated coach names
                await queryClient.invalidateQueries({ queryKey: ['trains', id] });

                // If a coach is selected, also invalidate its detail to refresh the name
                if (selectedCoachId) {
                    await queryClient.invalidateQueries({ queryKey: ['coaches', 'detail', selectedCoachId] });
                }
            } catch (error) {
                toast.error("Cập nhật thứ tự thất bại");
                // Revert on error
                setCoaches(coaches);
            }
        }
    }

    // Handler: Back
    const handleBack = () => {
        router.back()
    }

    // Handler: Seat Click (Admin)
    const handleSeatClick = (seat: Seat) => {
        setSelectedSeatForAdmin(seat)
        setIsSeatDialogOpen(true)
    }

    // Handler: Update Seat (Admin)
    const handleUpdateSeat = (updatedSeat: Seat) => {
        // Note: In a real implementation, this would call an API to update the seat
        // For now, we rely on React Query's cache invalidation
        toast.success(`Đã cập nhật ghế ${updatedSeat.name}`)
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>
    if (error) return <div className="p-8 text-center text-red-500">Đã có lỗi xảy ra khi tải dữ liệu tàu.</div>
    if (!train) return <div className="p-8 text-center text-red-500">Không tìm thấy tàu hoặc tàu không tồn tại.</div>

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                    {/* 1. Header & Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold flex items-center gap-2">
                                        <TrainFront className="w-5 h-5 text-primary" />
                                        {train.code}
                                    </h1>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                        train.status === 'ACTIVE' ? "bg-green-500/10 text-green-600 border border-green-200 dark:border-green-800" : "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {train.status === 'ACTIVE' ? 'Hoạt động' : train.status}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {train.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <EditTrainDialog train={train} />
                            <DeleteTrainAlert train={train} />
                        </div>
                    </div>

                    {/* 2. Main Content Area */}
                    <div className="space-y-6">

                        {/* 2.1 Coach Management Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Quản lý Toa & Ghế
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Chọn toa để xem và quản lý trạng thái các ghế.
                                </p>
                            </div>
                            <CreateCoachDialog trainId={id} />
                        </div>

                        {/* 2.2 Coach Navigation with Drag and Drop */}
                        <div className="grid grid-cols-1 w-full">
                            <div className="overflow-x-auto">
                                <div className="flex items-center gap-4 pb-2">
                                    {/* Train Engine */}
                                    <div className="shrink-0 relative flex items-center justify-center ps-7 pe-4 py-2 md:py-3 bg-primary text-primary-foreground font-bold text-sm self-stretch min-w-[120px] max-w-[120px]"
                                        style={{
                                            clipPath: 'polygon(46% 0, 100% 0, 100% 100%, 0% 100%)'
                                        }}>
                                        {train.code}
                                    </div>

                                    {/* Sortable Coaches */}
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                        modifiers={[restrictToHorizontalAxis]}
                                    >
                                        <SortableContext
                                            items={coaches.map(c => c.id)}
                                            strategy={horizontalListSortingStrategy}
                                        >
                                            <div className="flex items-center gap-2">
                                                {coaches.map((coach) => (
                                                    <SortableCoachItem
                                                        key={coach.id}
                                                        coach={coach}
                                                        isSelected={coach.id === selectedCoachId}
                                                        onSelect={setSelectedCoachId}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div>
                        </div>

                        {/* 2.3 Seat/Bed Layout Viewer (Admin Mode) */}
                        <div className="grid grid-cols-1 w-full border rounded-lg p-6 bg-card shadow-sm">
                            {selectedCoach && (
                                <>
                                    <div className="flex flex-col gap-4 mb-6 pb-4 border-b">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{selectedCoach.name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Loại: {selectedCoach.template.name} ({selectedCoach.template.code})
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 text-right">
                                                <div className="flex items-center gap-2">
                                                    <ToggleCoachStatusButton coach={selectedCoach} />
                                                    <DeleteCoachAlert coach={selectedCoach} />
                                                </div>
                                                {selectedCoachDetail && (
                                                    <div className="text-xs font-medium text-muted-foreground">
                                                        {selectedCoachDetail.seats.length} {selectedCoachDetail.template.layout === 'SEAT' ? 'ghế' : 'giường'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Render appropriate viewer based on coach type */}
                                    {isLoadingCoachDetail ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-muted-foreground">Đang tải dữ liệu ghế...</div>
                                        </div>
                                    ) : selectedCoachDetail ? (
                                        selectedCoachDetail.template.layout === 'SEAT' ? (
                                            <SeatLayoutViewer
                                                coach={selectedCoachDetail}
                                                onSeatClick={handleSeatClick}
                                                selectedSeats={[]}
                                                isAdmin={true}
                                            />
                                        ) : (
                                            <BedLayoutViewer
                                                coach={selectedCoachDetail}
                                                onSeatClick={handleSeatClick}
                                                selectedSeats={[]}
                                                isAdmin={true}
                                            />
                                        )
                                    ) : (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-muted-foreground">Chọn một toa để xem chi tiết</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Admin Seat Detail Dialog */}
                    <AdminSeatDetailDialog
                        open={isSeatDialogOpen}
                        onOpenChange={setIsSeatDialogOpen}
                        seat={selectedSeatForAdmin}
                        onUpdate={handleUpdateSeat}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
