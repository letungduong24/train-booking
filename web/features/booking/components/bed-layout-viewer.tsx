"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Seat, SeatStatus } from "@/lib/schemas/seat.schema"
import { Coach } from "@/lib/schemas/coach.schema"
import { getSeatStatusColor, getSeatStatusLabel } from "@/lib/mock-data/train"

interface BedLayoutViewerProps {
    seats: any[] // TODO: Define proper type
    template: any // TODO: Define proper type
    onSeatClick: (seat: any) => void
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

export function BedLayoutViewer({ seats, template, onSeatClick, selectedSeats = [], isAdmin = false }: BedLayoutViewerProps) {
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
                                {seats.filter(s => s.bookingStatus === 'AVAILABLE').length}
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
                                                    disabled={!isAdmin && ((leftBed.bookingStatus || leftBed.status) !== 'AVAILABLE' && !selectedSeats.includes(leftBed.id))}
                                                    className={cn(
                                                        "h-12 flex items-center justify-center rounded transition-all font-semibold text-sm border",
                                                        selectedSeats.includes(leftBed.id)
                                                            ? "bg-blue-500 text-white hover:bg-blue-600 border-transparent shadow-md"
                                                            : getSeatStatusColor(isAdmin ? leftBed.status : (leftBed.bookingStatus || leftBed.status), isAdmin)
                                                    )}
                                                    title={`Giường ${leftBed.name} - ${getSeatStatusLabel(leftBed.status, isAdmin)}`}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className={cn("text-xs font-bold", selectedSeats.includes(leftBed.id) ? "text-white" : "text-foreground")}>
                                                            Giường {leftBed.name}
                                                        </span>
                                                        {!isAdmin && ((leftBed.bookingStatus || leftBed.status) === 'AVAILABLE' || selectedSeats.includes(leftBed.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(leftBed.id) ? "text-blue-100" : "text-black"
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
                                                    disabled={!isAdmin && ((rightBed.bookingStatus || rightBed.status) !== 'AVAILABLE' && !selectedSeats.includes(rightBed.id))}
                                                    className={cn(
                                                        "h-12 flex items-center justify-center rounded transition-all font-semibold text-sm border",
                                                        selectedSeats.includes(rightBed.id)
                                                            ? "bg-blue-500 text-white hover:bg-blue-600 border-transparent shadow-md"
                                                            : getSeatStatusColor(isAdmin ? rightBed.status : (rightBed.bookingStatus || rightBed.status), isAdmin)
                                                    )}
                                                    title={`Giường ${rightBed.name} - ${getSeatStatusLabel(rightBed.status, isAdmin)}`}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className={cn("text-xs font-bold", selectedSeats.includes(rightBed.id) ? "text-white" : "text-foreground")}>
                                                            Giường {rightBed.name}
                                                        </span>
                                                        {!isAdmin && ((rightBed.bookingStatus || rightBed.status) === 'AVAILABLE' || selectedSeats.includes(rightBed.id)) && (
                                                            <span className={cn(
                                                                "text-[10px] font-medium leading-none mt-0.5",
                                                                selectedSeats.includes(rightBed.id) ? "text-blue-100" : "text-black"
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
