import { useEffect, useState } from "react"
import { cn, formatPrice } from "@/lib/utils"
import { getSeatStatusColor, getSeatStatusLabel } from "@/lib/utils/seat-helper"
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
}



export function BedLayoutViewer({ seats, template, onSeatClick, selectedSeats = [], isAdmin = false, tripId, onSeatsForceDeselected, isSubmitting = false }: BedLayoutViewerProps) {
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
                                            {leftBed && (
                                                <button
                                                    onClick={() => onSeatClick(leftBed)}
                                                    disabled={!isAdmin && ((leftBed.bookingStatus || leftBed.status) !== 'AVAILABLE' || lockedSeatIds.includes(leftBed.id)) && !selectedSeats.includes(leftBed.id)}
                                                    className={cn(
                                                        "h-12 flex items-center justify-center rounded transition-all font-semibold text-sm border",
                                                        selectedSeats.includes(leftBed.id)
                                                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent shadow-md"
                                                            : (lockedSeatIds.includes(leftBed.id) && !isAdmin) ? "bg-[#E5BA41] text-white border-[#E5BA41] cursor-not-allowed" : getSeatStatusColor(isAdmin ? leftBed.status : (leftBed.bookingStatus || leftBed.status), isAdmin)
                                                    )}
                                                    title={`Giường ${leftBed.name} - ${getSeatStatusLabel(leftBed.status, isAdmin)}`}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className={cn("text-xs font-bold", selectedSeats.includes(leftBed.id) ? "text-white" : "text-foreground")}>
                                                            Giường {leftBed.name}
                                                        </span>
                                                        {!isAdmin && ((leftBed.bookingStatus || leftBed.status) === 'AVAILABLE' && !lockedSeatIds.includes(leftBed.id) || selectedSeats.includes(leftBed.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(leftBed.id) ? "text-secondary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                {formatPrice(leftBed.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            )}

                                            {/* Tier indicator */}
                                            <div className="px-2 text-xs text-muted-foreground whitespace-nowrap">
                                                Tầng {tierNumber}
                                            </div>

                                            {/* Right bed */}
                                            {rightBed && (
                                                <button
                                                    onClick={() => onSeatClick(rightBed)}
                                                    disabled={!isAdmin && ((rightBed.bookingStatus || rightBed.status) !== 'AVAILABLE' || lockedSeatIds.includes(rightBed.id)) && !selectedSeats.includes(rightBed.id)}
                                                    className={cn(
                                                        "h-12 flex items-center justify-center rounded transition-all font-semibold text-sm border",
                                                        selectedSeats.includes(rightBed.id)
                                                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 border-transparent shadow-md"
                                                            : (lockedSeatIds.includes(rightBed.id) && !isAdmin) ? "bg-[#E5BA41] text-white border-[#E5BA41] cursor-not-allowed" : getSeatStatusColor(isAdmin ? rightBed.status : (rightBed.bookingStatus || rightBed.status), isAdmin)
                                                    )}
                                                    title={`Giường ${rightBed.name} - ${getSeatStatusLabel(rightBed.status, isAdmin)}`}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className={cn("text-xs font-bold", selectedSeats.includes(rightBed.id) ? "text-white" : "text-foreground")}>
                                                            Giường {rightBed.name}
                                                        </span>
                                                        {!isAdmin && ((rightBed.bookingStatus || rightBed.status) === 'AVAILABLE' && !lockedSeatIds.includes(rightBed.id) || selectedSeats.includes(rightBed.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(rightBed.id) ? "text-secondary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                {formatPrice(rightBed.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            )}
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
