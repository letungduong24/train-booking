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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ArrowLeft, Settings, TrainFront, Loader2, Edit, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

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

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex justify-between">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="h-16 flex items-center gap-2 overflow-hidden">
                        <Skeleton className="h-full w-24 shrink-0" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-full w-24 shrink-0" />
                        ))}
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-lg" />
                </div>
            </div>
        );
    }
    if (error) return <div className="p-8 text-center text-red-500 font-medium">Đã có lỗi xảy ra khi tải dữ liệu tàu.</div>
    if (!train) return <div className="p-8 text-center text-red-500 font-medium">Không tìm thấy tàu hoặc tàu không tồn tại.</div>

    return (

        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
            {/* 1. Header & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full hover:bg-rose-50 hover:text-[#802222]">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">
                                {train.code}
                            </h1>
                            <Badge variant={train.status === 'ACTIVE' ? 'default' : 'secondary'} className={cn(
                                "rounded-full px-3 py-0.5 text-[10px] font-bold border-none shadow-sm",
                                train.status === 'ACTIVE' ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                            )}>
                                {train.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">
                            {train.name}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <EditTrainDialog train={train} />
                    <DeleteTrainAlert train={train} />
                </div>
            </div>

            {/* 2. Main Premium Management Card */}
            <Card className="rounded-[2.5rem] border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative group overflow-hidden">
                <CardHeader className="p-6 pb-2 relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Quản lý Toa & Ghế</CardTitle>
                            <CardDescription className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest mt-1">
                                Thiết lập thứ tự toa và điều chỉnh trạng thái ghế/giường
                            </CardDescription>
                        </div>
                        <CreateCoachDialog trainId={id} />
                    </div>
                </CardHeader>
                
                <CardContent className="p-6 relative z-10">
                    <div className="space-y-8">
                        {/* 2.2 Coach Navigation with Drag and Drop */}
                        <div className="w-full overflow-x-auto pb-4">
                            <div className="flex items-center min-w-max">
                                {/* Train Engine */}
                                <div className="relative flex items-center justify-center ps-7 pe-4 py-2 md:py-3 bg-[#802222] text-white font-bold text-sm self-stretch min-w-[120px] max-w-[120px]"
                                    style={{
                                        clipPath: 'polygon(46% 0, 100% 0, 100% 100%, 0% 100%)'
                                    }}>
                                    <TrainFront className="mr-2 h-4 w-4" />
                                    {train.code}
                                </div>

                                {/* Rail Track after Engine */}
                                <div className="flex flex-col gap-1.5 flex-none w-8 items-center justify-center">
                                    <div className="h-0.5 w-full bg-muted-foreground/20"></div>
                                    <div className="h-0.5 w-full bg-muted-foreground/20"></div>
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
                                        <div className="flex items-center">
                                            {coaches.map((coach, index) => (
                                                <React.Fragment key={coach.id}>
                                                    <SortableCoachItem
                                                        coach={coach}
                                                        isSelected={coach.id === selectedCoachId}
                                                        onSelect={setSelectedCoachId}
                                                    />
                                                    {/* Rail Track Separator */}
                                                    {index < coaches.length - 1 && (
                                                        <div className="flex flex-col gap-1.5 flex-none w-8 items-center justify-center">
                                                            <div className="h-0.5 w-full bg-muted-foreground/20"></div>
                                                            <div className="h-0.5 w-full bg-muted-foreground/20"></div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </div>

                        {/* 2.3 Seat/Bed Layout Viewer Area */}
                        <div className="min-h-[400px]">
                            {selectedCoach ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-[#802222] dark:text-rose-400">
                                                <Settings className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">{selectedCoach.name}</h3>
                                                <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest mt-1">
                                                    Loại: {selectedCoach.template.name} ({selectedCoach.template.code})
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end mr-2">
                                                {selectedCoachDetail && (
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
                                                        {selectedCoachDetail.seats.length} {selectedCoachDetail.template.layout === 'SEAT' ? 'ghế' : 'giường'}
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <ToggleCoachStatusButton coach={selectedCoach} />
                                                    <DeleteCoachAlert coach={selectedCoach} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Render appropriate viewer based on coach type */}
                                    <div className="py-2">
                                        {isLoadingCoachDetail ? (
                                            <div className="flex items-center justify-center py-20">
                                                <Loader2 className="h-8 w-8 animate-spin text-[#802222]/40" />
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
                                                <div className="text-muted-foreground font-medium italic opacity-40">Chọn một toa để xem chi tiết sơ đồ</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-zinc-800">
                                    <div className="p-4 rounded-full bg-gray-50 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700 mb-4">
                                        <Settings className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Vui lòng chọn toa để xem sơ đồ</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
                
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-3xl z-0" />
                <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-3xl z-0" />
            </Card>

            {/* Admin Seat Detail Dialog */}
            <AdminSeatDetailDialog
                open={isSeatDialogOpen}
                onOpenChange={setIsSeatDialogOpen}
                seat={selectedSeatForAdmin}
                onUpdate={handleUpdateSeat}
            />
        </div>

    )
}
