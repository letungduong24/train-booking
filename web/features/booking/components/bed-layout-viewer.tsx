import { useEffect, useState, useRef } from "react"
import { cn, formatPrice } from "@/lib/utils"
import { getSeatStatusColor, getSeatStatusLabel, getComputedSeatStatus } from "@/lib/utils/seat-helper"
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
}



export function BedLayoutViewer({ seats, template, onSeatClick, selectedSeats = [], isAdmin = false, tripId, onSeatsForceDeselected, isSubmitting = false, highlightedSeatIds = [], focusedSeatId = null }: BedLayoutViewerProps) {
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sơ đồ giường nằm</h3>
                    <div className="text-sm text-muted-foreground">
                        {totalRows} khoang × {tiers} tầng
                    </div>
                </div>

                {/* Stats - Only show in User mode */}
                {!isAdmin && (
                    <div className="flex gap-4 text-sm bg-muted/20 rounded-lg w-full">
                        <div>
                            <span className="text-muted-foreground">Tổng số giường:</span>{' '}
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
                {/* User Booking Legend - Show for Admin too for consistency */}
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full border border-secondary" />
                    <span>{isAdmin ? 'Hoạt động (Trống)' : 'Còn trống'}</span>
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
                    <span>{isAdmin ? 'Đã vô hiệu hóa' : 'Không thể mua'}</span>
                </div>
            </div>

            {/* Compartments */}
            <div className="space-y-6">
                {Array.from({ length: totalRows }).map((_, compartmentIndex) => {
                    // Lọc tất cả giường trong khoang này
                    const compartmentBeds = seats
                        .filter(s => s.rowIndex === compartmentIndex)
                        .sort((a, b) => a.colIndex - b.colIndex)

                    return (
                        <div key={compartmentIndex} className="border rounded-lg p-4 bg-muted/20">
                            {/* Compartment header */}
                            <div className="text-sm font-semibold mb-3 text-center text-muted-foreground">
                                Khoang {compartmentIndex + 1}
                            </div>

                            {/* Tiers (from top to bottom) */}
                            <div className="space-y-2">
                                {Array.from({ length: tiers }).reverse().map((_, reversedIndex) => {
                                    const tierIndex = tiers - reversedIndex - 1
                                    const tierNumber = tierIndex + 1

                                    // Lọc 2 giường của tầng này (trái và phải)
                                    // Giường được sắp xếp: tầng 1 = index 0,1; tầng 2 = index 2,3; tầng 3 = index 4,5
                                    const leftBed = compartmentBeds[tierIndex * 2]
                                    const rightBed = compartmentBeds[tierIndex * 2 + 1]

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
                                                            "h-12 flex items-center justify-center rounded transition-all font-semibold text-sm border",
                                                            focusedSeatId === leftBed.id && "ring-4 ring-primary ring-offset-2 animate-pulse z-20",
                                                            highlightedSeatIds.includes(leftBed.id) && "ring-2 ring-primary/50 z-10",
                                                            selectedSeats.includes(leftBed.id)
                                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent shadow-md"
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
                                                            "h-12 flex items-center justify-center rounded transition-all font-semibold text-sm border",
                                                            focusedSeatId === rightBed.id && "ring-4 ring-primary ring-offset-2 animate-pulse z-20",
                                                            highlightedSeatIds.includes(rightBed.id) && "ring-2 ring-primary/50 z-10",
                                                            selectedSeats.includes(rightBed.id)
                                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent shadow-md"
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
            </div >
        </div >
    )
}
