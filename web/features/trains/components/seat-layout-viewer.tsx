"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Seat, SeatStatus } from "@/lib/schemas/seat.schema"
import { Coach } from "@/lib/schemas/coach.schema"
import { getSeatStatusColor, getSeatTypeIcon, getSeatStatusLabel } from "@/lib/utils/seat-helper"

interface SeatLayoutViewerProps {
    coach: Coach
    onSeatClick: (seat: Seat) => void
    selectedSeats?: string[]
    isAdmin?: boolean
}

// Helper to format price
const formatPrice = (price: number) => {
    if (price >= 1000000) {
        return `${(price / 1000000).toFixed(1)}tr`.replace('.0', '')
    }
    return `${Math.floor(price / 1000)}k`
}

export function SeatLayoutViewer({ coach, onSeatClick, selectedSeats = [], isAdmin = false }: SeatLayoutViewerProps) {
    const { template, seats } = coach
    const { totalRows, totalCols } = template

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
                                {seats.filter(s => s.status === 'AVAILABLE').length}
                            </span>
                        </div>
                        {/* Booked stats removed as physical seats don't have BOOKED status */}
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
                            <div className="w-4 h-4 rounded-full border border-yellow-500 bg-yellow-50" />
                            <span>Đã khóa/Bảo trì</span>
                        </div>
                    </>
                ) : (
                    // User Booking Legend
                    <>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-green-100 border border-green-500" />
                            <span>Còn trống</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center" />
                            <span>Đã chọn</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-red-100 border border-red-500" />
                            <span>Đã đặt</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-500" />
                            <span>Đang giữ chỗ</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-400 opacity-40" />
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
                                                // For Admin: Only LOCKED counts as 'unavailable'
                                                const displayStatus = isAdmin
                                                    ? (seat.status === 'LOCKED' ? 'LOCKED' : 'AVAILABLE')
                                                    : seat.status;

                                                return (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && (seat.status !== 'AVAILABLE' && !selectedSeats.includes(seat.id))}
                                                        className={cn(
                                                            "flex-1 aspect-square flex flex-col items-center justify-center rounded transition-all p-0.5 min-w-0 border",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-blue-500 text-white hover:bg-blue-600 border-transparent shadow-md"
                                                                : getSeatStatusColor(displayStatus)
                                                        )}
                                                        title={`Ghế ${seat.name}`}
                                                    >
                                                        <span className={cn("text-xs font-bold truncate", selectedSeats.includes(seat.id) ? "text-white" : "")}>
                                                            {seat.name}
                                                        </span>
                                                        {!isAdmin && (seat.status === 'AVAILABLE' || selectedSeats.includes(seat.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(seat.id) ? "text-blue-100" : "text-black"
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
                                                const displayStatus = isAdmin
                                                    ? (seat.status === 'LOCKED' ? 'LOCKED' : 'AVAILABLE')
                                                    : seat.status;
                                                return (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && (seat.status !== 'AVAILABLE' && !selectedSeats.includes(seat.id))}
                                                        className={cn(
                                                            "flex-1 aspect-square flex flex-col items-center justify-center rounded transition-all p-0.5 min-w-0 border",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-blue-500 text-white hover:bg-blue-600 border-transparent shadow-md"
                                                                : getSeatStatusColor(displayStatus)
                                                        )}
                                                        title={`Ghế ${seat.name}`}
                                                    >
                                                        <span className={cn("text-xs font-bold truncate", selectedSeats.includes(seat.id) ? "text-white" : "")}>
                                                            {seat.name}
                                                        </span>
                                                        {!isAdmin && (seat.status === 'AVAILABLE' || selectedSeats.includes(seat.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(seat.id) ? "text-blue-100" : "text-black"
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
                                gridTemplateColumns: `repeat(${totalRows}, minmax(60px, 80px))`
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
                                                const displayStatus = isAdmin
                                                    ? (seat.status === 'LOCKED' ? 'LOCKED' : 'AVAILABLE')
                                                    : seat.status;
                                                return (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && (seat.status !== 'AVAILABLE' && !selectedSeats.includes(seat.id))}
                                                        className={cn(
                                                            "aspect-square flex flex-col items-center justify-center rounded transition-all p-0.5 border",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-blue-500 text-white hover:bg-blue-600 border-transparent shadow-md"
                                                                : getSeatStatusColor(displayStatus, isAdmin)
                                                        )}
                                                        title={`Ghế ${seat.name} - ${getSeatStatusLabel(seat.status, isAdmin)}`}
                                                    >
                                                        <span className={cn("text-xs font-bold truncate", selectedSeats.includes(seat.id) ? "text-white" : "")}>
                                                            {seat.name}
                                                        </span>
                                                        {!isAdmin && (seat.status === 'AVAILABLE' || selectedSeats.includes(seat.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(seat.id) ? "text-blue-100" : "text-black"
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
                                                const displayStatus = isAdmin
                                                    ? (seat.status === 'LOCKED' ? 'LOCKED' : 'AVAILABLE')
                                                    : seat.status;
                                                return (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => onSeatClick(seat)}
                                                        disabled={!isAdmin && (seat.status !== 'AVAILABLE' && !selectedSeats.includes(seat.id))}
                                                        className={cn(
                                                            "aspect-square flex flex-col items-center justify-center rounded transition-all p-0.5 border",
                                                            selectedSeats.includes(seat.id)
                                                                ? "bg-blue-500 text-white hover:bg-blue-600 border-transparent shadow-md"
                                                                : getSeatStatusColor(displayStatus, isAdmin)
                                                        )}
                                                        title={`Ghế ${seat.name} - ${getSeatStatusLabel(seat.status, isAdmin)}`}
                                                    >
                                                        <span className={cn("text-xs font-bold truncate", selectedSeats.includes(seat.id) ? "text-white" : "")}>
                                                            {seat.name}
                                                        </span>
                                                        {!isAdmin && (seat.status === 'AVAILABLE' || selectedSeats.includes(seat.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(seat.id) ? "text-blue-100" : "text-black"
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
