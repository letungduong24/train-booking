"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Seat, SeatStatus } from "@/lib/schemas/seat.schema"
import { Coach } from "@/lib/schemas/coach.schema"
import { getSeatStatusColor, getSeatStatusLabel } from "@/lib/utils/seat-helper"

interface BedLayoutViewerProps {
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

export function BedLayoutViewer({ coach, onSeatClick, selectedSeats = [], isAdmin = false }: BedLayoutViewerProps) {
    const { template, seats } = coach
    const { totalRows, tiers } = template

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
                            <div className="w-4 h-4 rounded-full bg-muted border border-muted-foreground/30 opacity-40" />
                            <span>Đã vô hiệu hóa</span>
                        </div>
                    </>
                ) : (
                    // User Booking Legend
                    <>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-green-500/10 border border-green-500" />
                            <span>Còn trống</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center" />
                            <span>Đã chọn</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-destructive/10 border border-destructive" />
                            <span>Đã đặt</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-yellow-500/10 border border-yellow-500" />
                            <span>Đang giữ chỗ</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-muted border border-muted-foreground/30 opacity-40" />
                            <span>Không thể mua</span>
                        </div>
                    </>
                )}
            </div>

            {/* Compartments */}
            <div className="relative w-full overflow-x-auto p-1">
                <div className="space-y-8 min-w-full w-fit">
                    {Array.from({ length: totalRows }).map((_, compartmentIndex) => {
                        // Filter beds in this compartment
                        const compartmentBeds = seats.filter(s => s.rowIndex === compartmentIndex)

                        return (
                            <div key={compartmentIndex} className="p-4 lg:p-6 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                {/* Compartment header */}
                                <div className="text-[10px] font-bold mb-6 text-center text-muted-foreground/40 uppercase tracking-[0.2em]">
                                    Khoang {compartmentIndex + 1}
                                </div>

                                {/* Tiers (from top to bottom) */}
                                <div className="space-y-4">
                                    {Array.from({ length: tiers }).reverse().map((_, reversedIndex) => {
                                        const tierIndex = tiers - reversedIndex - 1
                                        const tierNumber = tierIndex + 1

                                        const leftBed = compartmentBeds.find(s => s.tier === tierIndex && s.colIndex === 0)
                                        const rightBed = compartmentBeds.find(s => s.tier === tierIndex && s.colIndex === 1)

                                        return (
                                            <div key={tierIndex} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                                                {/* Left bed */}
                                                {leftBed && (
                                                    <button
                                                        onClick={() => onSeatClick(leftBed)}
                                                        disabled={!isAdmin && (leftBed.status !== 'AVAILABLE' && !selectedSeats.includes(leftBed.id))}
                                                        className={cn(
                                                            "h-14 flex items-center justify-center rounded-xl transition-all font-semibold text-sm border shadow-sm",
                                                            selectedSeats.includes(leftBed.id)
                                                                ? "bg-[#802222] text-white hover:bg-rose-900 border-transparent shadow-rose-900/20"
                                                                : getSeatStatusColor(isAdmin ? (leftBed.status === 'DISABLED' ? 'DISABLED' : 'AVAILABLE') : leftBed.status, isAdmin)
                                                        )}
                                                        title={`Giường ${leftBed.name} - ${getSeatStatusLabel(leftBed.status, isAdmin)}`}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <span className={cn("text-xs font-bold", selectedSeats.includes(leftBed.id) ? "text-white" : "text-foreground")}>
                                                                Giường {leftBed.name}
                                                            </span>
                                                            {!isAdmin && (leftBed.status === 'AVAILABLE' || selectedSeats.includes(leftBed.id)) && (
                                                                <span className={cn(
                                                                    "text-[10px] font-medium leading-none mt-0.5",
                                                                    selectedSeats.includes(leftBed.id) ? "text-rose-100" : "text-muted-foreground"
                                                                )}>
                                                                    {formatPrice(leftBed.price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                )}

                                                {/* Tier indicator */}
                                                <div className="px-2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest whitespace-nowrap">
                                                    Tầng {tierNumber}
                                                </div>

                                                {/* Right bed */}
                                                {rightBed && (
                                                    <button
                                                        onClick={() => onSeatClick(rightBed)}
                                                        disabled={!isAdmin && (rightBed.status !== 'AVAILABLE' && !selectedSeats.includes(rightBed.id))}
                                                        className={cn(
                                                            "h-14 flex items-center justify-center rounded-xl transition-all font-semibold text-sm border shadow-sm",
                                                            selectedSeats.includes(rightBed.id)
                                                                ? "bg-[#802222] text-white hover:bg-rose-900 border-transparent shadow-rose-900/20"
                                                                : getSeatStatusColor(isAdmin ? (rightBed.status === 'DISABLED' ? 'DISABLED' : 'AVAILABLE') : rightBed.status, isAdmin)
                                                        )}
                                                        title={`Giường ${rightBed.name} - ${getSeatStatusLabel(rightBed.status, isAdmin)}`}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <span className={cn("text-xs font-bold", selectedSeats.includes(rightBed.id) ? "text-white" : "text-foreground")}>
                                                                Giường {rightBed.name}
                                                            </span>
                                                            {!isAdmin && (rightBed.status === 'AVAILABLE' || selectedSeats.includes(rightBed.id)) && (
                                                                <span className={cn(
                                                                    "text-[10px] font-medium leading-none mt-0.5",
                                                                    selectedSeats.includes(rightBed.id) ? "text-rose-100" : "text-muted-foreground"
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
                </div>
            </div >


        </div >
    )
}
