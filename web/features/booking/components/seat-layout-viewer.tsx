import * as React from "react"
import { useEffect, useState, useRef } from "react"
import { cn, formatPrice } from "@/lib/utils"
import { Seat } from "@/lib/schemas/seat.schema"
import { CoachTemplate } from "@/lib/schemas/coach.schema"
import { getSeatStatusColor, getSeatStatusLabel, getComputedSeatStatus } from "@/lib/utils/seat-helper"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSocketStore } from "@/lib/store/socket.store"
import { useLockedSeats } from "../hooks/use-locked-seats"

interface SeatLayoutViewerProps {
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



export function SeatLayoutViewer({ seats, template, onSeatClick, selectedSeats = [], isAdmin = false, tripId, onSeatsForceDeselected, isSubmitting = false, highlightedSeatIds = [], focusedSeatId = null, coachName, onSearchPassenger }: SeatLayoutViewerProps) {
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

    const { totalRows } = template
    const [lockedSeatIds, setLockedSeatIds] = useState<string[]>([])

    // Fetch initial locked seats using custom hook
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
    }, [tripId, socket])

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
                                data-search-passenger="true"
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
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Tổng số ghế</span>
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

            {/* Seat Grid */}
            <div className="relative w-full overflow-x-auto">
                <div className="w-fit min-w-full">
                    {/* Mobile: Vertical layout (rows stacked) */}
                    <div className="md:hidden">
                        <div
                            className="grid gap-2"
                            style={{
                                gridTemplateColumns: 'auto 1fr auto 1fr',
                                gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`
                            }}
                        >
                            {Array.from({ length: totalRows }).map((_, rowIndex) => {
                                const rowSeats = seats
                                    .filter(s => s.rowIndex === rowIndex)
                                    .sort((a, b) => a.colIndex - b.colIndex)

                                return (
                                    <React.Fragment key={rowIndex}>
                                        {/* Row number */}
                                        <div
                                            className="flex items-center justify-center text-xs text-muted-foreground font-mono"
                                            style={{ gridRow: rowIndex + 1, gridColumn: 1 }}
                                        >
                                            {rowIndex + 1}
                                        </div>

                                        {/* Left seats (columns 0-1) */}
                                        <div
                                            className="flex gap-2"
                                            style={{ gridRow: rowIndex + 1, gridColumn: 2 }}
                                        >
                                            {rowSeats.slice(0, 2).map((seat) => {
                                                const displayStatus = getComputedSeatStatus(seat, lockedSeatIds, isAdmin);

                                                return (
                                                    <button
                                                        key={seat.id}
                                                        id={`seat-${seat.id}`}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
                                                        className={cn(
                                                            "flex-1 flex flex-col items-center justify-center rounded-lg transition-all py-1.5 min-w-0 border shadow-sm aspect-square w-14 h-14 md:w-16 md:h-16",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-zinc-500/20"
                                                                : getSeatStatusColor(displayStatus, isAdmin),
                                                            focusedSeatId === seat.id && "ring-4 ring-[#802222] ring-offset-2 animate-pulse",
                                                            highlightedSeatIds.includes(seat.id) && "ring-2 ring-[#802222]/50"
                                                        )}
                                                        title={`Ghế ${seat.name}`}
                                                    >
                                                        <span className={cn("text-xs font-bold truncate", selectedSeats.includes(seat.id) ? "text-white" : "")}>
                                                            {seat.name}
                                                        </span>
                                                        {!isAdmin && (displayStatus === 'AVAILABLE' || selectedSeats.includes(seat.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(seat.id) ? "text-secondary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                {formatPrice(seat.price)}
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {/* Aisle */}
                                        <div
                                            className="flex items-center justify-center w-8"
                                            style={{ gridRow: rowIndex + 1, gridColumn: 3 }}
                                        >
                                            <div className="h-full w-px bg-border" />
                                        </div>

                                        {/* Right seats (columns 2-3) */}
                                        <div
                                            className="flex gap-2"
                                            style={{ gridRow: rowIndex + 1, gridColumn: 4 }}
                                        >
                                            {rowSeats.slice(2, 4).map((seat) => {
                                                const displayStatus = getComputedSeatStatus(seat, lockedSeatIds, isAdmin);

                                                return (
                                                    <button
                                                        key={seat.id}
                                                        id={`seat-${seat.id}`}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
                                                        className={cn(
                                                            "flex-1 flex flex-col items-center justify-center rounded-lg transition-all py-1.5 min-w-0 border shadow-sm aspect-square w-14 h-14 md:w-16 md:h-16",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-zinc-500/20"
                                                                : getSeatStatusColor(displayStatus, isAdmin),
                                                            focusedSeatId === seat.id && "ring-4 ring-[#802222] ring-offset-2 animate-pulse",
                                                            highlightedSeatIds.includes(seat.id) && "ring-2 ring-[#802222]/50"
                                                        )}
                                                        title={`Ghế ${seat.name}`}
                                                    >
                                                        <span className={cn("text-xs font-bold truncate", selectedSeats.includes(seat.id) ? "text-white" : "")}>
                                                            {seat.name}
                                                        </span>
                                                        {!isAdmin && (displayStatus === 'AVAILABLE' || selectedSeats.includes(seat.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(seat.id) ? "text-secondary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                {formatPrice(seat.price)}
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </React.Fragment>
                                )
                            })}
                        </div>
                    </div>

                    {/* Desktop: Horizontal layout (columns scroll horizontally) */}
                    <div className="hidden md:block w-full pb-2">
                        <div
                            className="grid gap-2 min-w-max"
                            style={{
                                gridTemplateRows: 'auto 1fr auto 1fr',
                                gridTemplateColumns: `repeat(${totalRows}, minmax(48px, 64px))`
                            }}
                        >
                            {Array.from({ length: totalRows }).map((_, rowIndex) => {
                                const rowSeats = seats
                                    .filter(s => s.rowIndex === rowIndex)
                                    .sort((a, b) => a.colIndex - b.colIndex)

                                return (
                                    <React.Fragment key={rowIndex}>
                                        {/* Row number (now at top) */}
                                        <div
                                            className="flex items-center justify-center text-xs text-muted-foreground font-mono"
                                            style={{ gridColumn: rowIndex + 1, gridRow: 1 }}
                                        >
                                            {rowIndex + 1}
                                        </div>

                                        {/* Left seats (now top seats) */}
                                        <div
                                            className="flex flex-col gap-2"
                                            style={{ gridColumn: rowIndex + 1, gridRow: 2 }}
                                        >
                                            {rowSeats.slice(0, 2).map((seat) => {
                                                const displayStatus = getComputedSeatStatus(seat, lockedSeatIds, isAdmin);

                                                return (
                                                    <button
                                                        key={seat.id}
                                                        id={`seat-${seat.id}`}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
                                                        className={cn(
                                                            "w-14 h-14 md:w-16 md:h-16 flex flex-col items-center justify-center rounded-lg transition-all p-1 border shadow-sm aspect-square",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-zinc-500/20"
                                                                : getSeatStatusColor(displayStatus, isAdmin),
                                                            focusedSeatId === seat.id && "ring-4 ring-[#802222] ring-offset-2 animate-pulse",
                                                            highlightedSeatIds.includes(seat.id) && "ring-2 ring-[#802222]/50"
                                                        )}
                                                        title={`Ghế ${seat.name} - ${getSeatStatusLabel(seat.status, isAdmin)}`}
                                                    >
                                                        <span className={cn("text-xs font-bold truncate", selectedSeats.includes(seat.id) ? "text-white" : "")}>
                                                            {seat.name}
                                                        </span>
                                                        {!isAdmin && (displayStatus === 'AVAILABLE' || selectedSeats.includes(seat.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(seat.id) ? "text-secondary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                {formatPrice(seat.price)}
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {/* Aisle (now horizontal) */}
                                        <div
                                            className="flex items-center justify-center h-8"
                                            style={{ gridColumn: rowIndex + 1, gridRow: 3 }}
                                        >
                                            <div className="w-full h-px bg-border" />
                                        </div>

                                        {/* Right seats (now bottom seats) */}
                                        <div
                                            className="flex flex-col gap-2"
                                            style={{ gridColumn: rowIndex + 1, gridRow: 4 }}
                                        >
                                            {rowSeats.slice(2, 4).map((seat) => {
                                                const displayStatus = getComputedSeatStatus(seat, lockedSeatIds, isAdmin);

                                                return (
                                                    <button
                                                        key={seat.id}
                                                        id={`seat-${seat.id}`}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
                                                        className={cn(
                                                            "w-14 h-14 md:w-16 md:h-16 flex flex-col items-center justify-center rounded-lg transition-all p-1 border shadow-sm aspect-square",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent shadow-zinc-500/20"
                                                                : getSeatStatusColor(displayStatus, isAdmin),
                                                            focusedSeatId === seat.id && "ring-4 ring-[#802222] ring-offset-2 animate-pulse",
                                                            highlightedSeatIds.includes(seat.id) && "ring-2 ring-[#802222]/50"
                                                        )}
                                                        title={`Ghế ${seat.name} - ${getSeatStatusLabel(seat.status, isAdmin)}`}
                                                    >
                                                        <span className={cn("text-xs font-bold truncate", selectedSeats.includes(seat.id) ? "text-white" : "")}>
                                                            {seat.name}
                                                        </span>
                                                        {!isAdmin && (displayStatus === 'AVAILABLE' || selectedSeats.includes(seat.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(seat.id) ? "text-secondary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                {formatPrice(seat.price)}
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </React.Fragment>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
