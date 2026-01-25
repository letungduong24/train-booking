import * as React from "react"
import { useEffect, useState } from "react"
import { cn, formatPrice } from "@/lib/utils"
import { Seat } from "@/lib/schemas/seat.schema"
import { CoachTemplate } from "@/lib/schemas/coach.schema"
import { getSeatStatusColor, getSeatStatusLabel, getComputedSeatStatus } from "@/lib/utils/seat-helper"
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
}



export function SeatLayoutViewer({ seats, template, onSeatClick, selectedSeats = [], isAdmin = false, tripId, onSeatsForceDeselected, isSubmitting = false }: SeatLayoutViewerProps) {
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sơ đồ ghế ngồi</h3>
                    <div className="text-sm text-muted-foreground">
                        {template.name}
                    </div>
                </div>

                {/* Stats - Only show in User mode */}
                {!isAdmin && (
                    <div className="flex gap-4 text-sm bg-muted/20 rounded-lg w-full">
                        <div>
                            <span className="text-muted-foreground">Tổng số ghế:</span>{' '}
                            <span className="font-semibold">{seats.length}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Còn trống:</span>{' '}
                            <span className="font-semibold text-green-600">
                                {seats.filter(s => s.bookingStatus === 'AVAILABLE' && !lockedSeatIds.includes(s.id)).length}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Đã đặt:</span>{' '}
                            <span className="font-semibold text-red-600">
                                {seats.filter(s => s.bookingStatus === 'BOOKED').length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
                {isAdmin ? (
                    // Admin Legend
                    <>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full border border-green-500" />
                            <span>Hoạt động</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-muted" />
                            <span>Đã vô hiệu hóa</span>
                        </div>
                    </>
                ) : (
                    // User Booking Legend
                    <>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full border border-secondary" />
                            <span>Còn trống</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center" />
                            <span>Đã chọn</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-primary/50 border border-primary" />
                            <span>Đã đặt</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-[#E5BA41] border border-[#E5BA41]" />
                            <span>Đang giữ chỗ</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-muted" />
                            <span>Không thể mua</span>
                        </div>
                    </>
                )}
            </div>

            {/* Seat Grid */}
            <div className="relative">
                <div className="border rounded-lg p-4 bg-muted/20">
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
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
                                                        className={cn(
                                                            "flex-1 flex flex-col items-center justify-center rounded-md transition-all py-2 min-w-0 border",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-blue-400 text-white hover:bg-blue-500 border-transparent shadow-sm"
                                                                : getSeatStatusColor(displayStatus, isAdmin)
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
                                                const isLocked = lockedSeatIds.includes(seat.id)
                                                const displayStatus = getComputedSeatStatus(seat, lockedSeatIds, isAdmin);

                                                return (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
                                                        className={cn(
                                                            "flex-1 flex flex-col items-center justify-center rounded-md transition-all py-2 min-w-0 border",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent shadow-sm"
                                                                : getSeatStatusColor(displayStatus, isAdmin)
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
                    <div className="hidden md:block w-full overflow-x-auto pb-2">
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
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
                                                        className={cn(
                                                            "h-14 flex flex-col items-center justify-center rounded-md transition-all p-0.5 border",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent shadow-sm"
                                                                : getSeatStatusColor(displayStatus, isAdmin)
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
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && displayStatus !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
                                                        className={cn(
                                                            "h-14 flex flex-col items-center justify-center rounded-md transition-all p-0.5 border",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent shadow-sm"
                                                                : getSeatStatusColor(displayStatus, isAdmin)
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
