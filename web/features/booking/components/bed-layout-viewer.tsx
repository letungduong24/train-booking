import { useEffect, useState, useRef } from "react"
import { cn, formatPrice } from "@/lib/utils"
import { getSeatStatusColor, getSeatStatusLabel, getComputedSeatStatus } from "@/lib/utils/seat-helper"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Seat } from "@/lib/schemas/seat.schema"
import { CoachTemplate } from "@/lib/schemas/coach.schema"
import { useSocketStore } from "@/lib/store/socket.store"
import { useLockedSeats } from "../hooks/use-locked-seats"

interface BedLayoutViewerProps {
    seats: Seat[]
    template: CoachTemplate
    onSeatClick: (seat: Seat) => void
    selectedSeats?: string[]
    isAdmin?: boolean
    tripId?: string
    onSeatsForceDeselected?: (seatIds: string[]) => void
    isSubmitting?: boolean
    highlightedSeatIds?: string[]
    focusedSeatId?: string | null
    coachName?: string
    onSearchPassenger?: () => void
}



export function BedLayoutViewer({ seats, template, onSeatClick, selectedSeats = [], isAdmin = false, tripId, onSeatsForceDeselected, isSubmitting = false, highlightedSeatIds = [], focusedSeatId = null, coachName, onSearchPassenger }: BedLayoutViewerProps) {

    const lastScrolledSeatId = useRef<string | null>(null)

    // Scroll to focused seat
    useEffect(() => {
        if (focusedSeatId && focusedSeatId !== lastScrolledSeatId.current) {
            const element = document.getElementById(`seat-${focusedSeatId}`)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                lastScrolledSeatId.current = focusedSeatId
            }
        }
    }, [focusedSeatId])

    const { totalRows, tiers } = template
    const [lockedSeatIds, setLockedSeatIds] = useState<string[]>([])

    const { socket } = useSocketStore();

    // Fetch initial locked seats using custom hook
    const { data: initialLockedSeats } = useLockedSeats(tripId);

    // Sync initial data to local state
    useEffect(() => {
        if (initialLockedSeats) {
            setLockedSeatIds(initialLockedSeats)
        }
    }, [initialLockedSeats])

    // Real-time updates
    useEffect(() => {
        if (!tripId || !socket) return

        function onSeatsLocked(data: { tripId: string, seatIds: string[] }) {
            if (data.tripId === tripId) {
                setLockedSeatIds(prev => {
                    const newIds = data.seatIds.filter(id => !prev.includes(id))

                    // Check for conflicts with selected seats
                    if (onSeatsForceDeselected && selectedSeats.length > 0 && !isSubmitting) {
                        const conflicts = data.seatIds.filter(id => selectedSeats.includes(id));
                        if (conflicts.length > 0) {
                            onSeatsForceDeselected(conflicts);
                        }
                    }

                    return [...prev, ...newIds]
                })
            }
        }

        function onSeatsReleased(data: { tripId: string, seatIds: string[] }) {
            if (data.tripId === tripId) {
                setLockedSeatIds(prev => prev.filter(id => !data.seatIds.includes(id)))
            }
        }

        socket.on("seats.locked", onSeatsLocked)
        socket.on("seats.released", onSeatsReleased)

        return () => {
            socket.off("seats.locked", onSeatsLocked)
            socket.off("seats.released", onSeatsReleased)
        }
    }, [tripId, socket, selectedSeats, onSeatsForceDeselected, isSubmitting])

    // Handle conflicts
    useEffect(() => {
        if (selectedSeats.length > 0 && onSeatsForceDeselected && !isSubmitting) {
            const conflicts = selectedSeats.filter(id => lockedSeatIds.includes(id));
            if (conflicts.length > 0) {
                onSeatsForceDeselected(conflicts);
            }
        }
    }, [lockedSeatIds, selectedSeats, onSeatsForceDeselected, isSubmitting]);

    return (
        <div className="space-y-4 w-full min-w-0 p-1">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">
                            {coachName}
                        </h3>
                        <p className="text-[13px] font-medium text-muted-foreground mt-1">
                            {template.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && onSearchPassenger && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onSearchPassenger}
                                className="h-8 gap-2"
                            >
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline">Tìm hành khách</span>
                                {seats.filter(s => s.passenger && (s.bookingStatus === 'BOOKED' || s.bookingStatus === 'HOLDING')).length > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                                    >
                                        {seats.filter(s => s.passenger && (s.bookingStatus === 'BOOKED' || s.bookingStatus === 'HOLDING')).length}
                                    </Badge>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats - Only show in User mode */}
                {!isAdmin && (
                <div className="flex gap-4 text-sm bg-white dark:bg-zinc-900/50 rounded-2xl w-full p-4 px-6 border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.03]">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Tổng số giường</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{seats.length}</span>
                    </div>
                    <div className="w-px bg-gray-100 dark:bg-zinc-800 mx-2" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Còn trống</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {seats.filter(s => s.bookingStatus === 'AVAILABLE' && !lockedSeatIds.includes(s.id)).length}
                        </span>
                    </div>
                    <div className="w-px bg-gray-100 dark:bg-zinc-800 mx-2" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Đã đặt</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                            {seats.filter(s => s.bookingStatus === 'BOOKED').length}
                        </span>
                    </div>
                </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
                {/* User Booking Legend - Show for Admin too for consistency */}
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full border border-emerald-500" />
                    <span>{isAdmin ? 'Hoạt động (Trống)' : 'Còn trống'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-zinc-800 text-white flex items-center justify-center shadow-lg" />
                    <span>Đã chọn</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-rose-600 border border-rose-600 shadow-rose-500/30 shadow-md" />
                    <span>Đã đặt</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 border border-yellow-500 shadow-yellow-500/30 shadow-md" />
                    <span>Đang giữ chỗ</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600" />
                    <span>{isAdmin ? 'Đã vô hiệu hóa' : 'Không thể mua'}</span>
                </div>
            </div>

            {/* Compartments - Horizontal scroll wrapper */}
            <div className="space-y-2 w-full overflow-x-auto p-1">
                <div className="w-fit min-w-full space-y-4">
                    {Array.from({ length: totalRows }).map((_, compartmentIndex) => {
                        // Lọc tất cả giường trong khoang này
                        const compartmentBeds = seats.filter(s => s.rowIndex === compartmentIndex)

                        return (
                            <div key={compartmentIndex} className="w-fit min-w-full p-2">
                                {/* Compartment header */}
                                <div className="text-[11px] font-bold mb-1 text-center text-muted-foreground uppercase tracking-widest opacity-50">
                                    Khoang {compartmentIndex + 1}
                                </div>

                                {/* Tiers (from top to bottom) */}
                                <div className="space-y-1">
                                    {Array.from({ length: tiers }).reverse().map((_, reversedIndex) => {
                                        const tierIndex = tiers - reversedIndex - 1
                                        const tierNumber = tierIndex + 1

                                        const leftBed = compartmentBeds.find(s => s.tier === tierIndex && s.colIndex === 0)
                                        const rightBed = compartmentBeds.find(s => s.tier === tierIndex && s.colIndex === 1)

                                        return (
                                            <div key={tierIndex} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                                {/* Left bed */}
                                                {leftBed && (() => {
                                                    const displayStatus = getComputedSeatStatus(leftBed, lockedSeatIds, isAdmin);
                                                    return (
                                                        <button
                                                            onClick={() => onSeatClick(leftBed)}
                                                            disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(leftBed.id)}
                                                            className={cn(
                                                                "h-10 flex items-center justify-center rounded-lg transition-all font-semibold text-xs border shadow-sm",
                                                                focusedSeatId === leftBed.id && "ring-4 ring-[#802222] ring-offset-2 animate-pulse z-20",
                                                                highlightedSeatIds.includes(leftBed.id) && "ring-2 ring-[#802222]/50 z-10",
                                                                selectedSeats.includes(leftBed.id)
                                                                    ? "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-zinc-500/20"
                                                                    : getSeatStatusColor(displayStatus, isAdmin)
                                                            )}
                                                            id={`seat-${leftBed.id}`}
                                                            title={`Giường ${leftBed.name} - ${getSeatStatusLabel(leftBed.status, isAdmin)}`}
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <span className={cn("text-xs font-bold", selectedSeats.includes(leftBed.id) ? "text-white" : "")}>
                                                                    Giường {leftBed.name}
                                                                </span>
                                                                {!isAdmin && (displayStatus === 'AVAILABLE' || selectedSeats.includes(leftBed.id)) && (
                                                                    <span className={cn(
                                                                        "text-[10px] font-medium leading-none mt-0.5",
                                                                        selectedSeats.includes(leftBed.id) ? "text-secondary-foreground/80" : "text-muted-foreground"
                                                                    )}>
                                                                        {formatPrice(leftBed.price)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    )
                                                })()}

                                                {/* Tier indicator */}
                                                <div className="px-2 text-xs text-muted-foreground whitespace-nowrap">
                                                    Tầng {tierNumber}
                                                </div>

                                                {/* Right bed */}
                                                {rightBed && (() => {
                                                    const displayStatus = getComputedSeatStatus(rightBed, lockedSeatIds, isAdmin);
                                                    return (
                                                        <button
                                                            onClick={() => onSeatClick(rightBed)}
                                                            disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(rightBed.id)}
                                                            className={cn(
                                                                "h-10 flex items-center justify-center rounded-lg transition-all font-semibold text-xs border shadow-sm",
                                                                focusedSeatId === rightBed.id && "ring-4 ring-[#802222] ring-offset-2 animate-pulse z-20",
                                                                highlightedSeatIds.includes(rightBed.id) && "ring-2 ring-[#802222]/50 z-10",
                                                                selectedSeats.includes(rightBed.id)
                                                                    ? "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-zinc-500/20"
                                                                    : getSeatStatusColor(displayStatus, isAdmin)
                                                            )}
                                                            id={`seat-${rightBed.id}`}
                                                            title={`Giường ${rightBed.name} - ${getSeatStatusLabel(rightBed.status, isAdmin)}`}
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <span className={cn("text-xs font-bold", selectedSeats.includes(rightBed.id) ? "text-white" : "")}>
                                                                    Giường {rightBed.name}
                                                                </span>
                                                                {!isAdmin && (displayStatus === 'AVAILABLE' || selectedSeats.includes(rightBed.id)) && (
                                                                    <span className={cn(
                                                                        "text-[10px] font-medium leading-none mt-0.5",
                                                                        selectedSeats.includes(rightBed.id) ? "text-secondary-foreground/80" : "text-muted-foreground"
                                                                    )}>
                                                                        {formatPrice(rightBed.price)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    )
                                                })()}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div >
        </div >
    )
}
