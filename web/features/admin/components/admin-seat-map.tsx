"use client"

import { useState } from "react"
import { TripDetail } from "@/lib/schemas/trip.schema"
import { BookingCoachNavigationBar } from "@/features/booking/components/booking-coach-navigation-bar"
import { useCoachWithPrices } from "@/features/booking/hooks/use-coach-with-prices"
import { SeatLayoutViewer } from "@/features/booking/components/seat-layout-viewer"
import { BedLayoutViewer } from "@/features/booking/components/bed-layout-viewer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Seat } from "@/lib/schemas/seat.schema"
import { toast } from "sonner"
import { useSocketStore } from "@/lib/store/socket.store"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PassengerSearchDialog, type PassengerInfo } from "./passenger-search-dialog"
import { RouteMap } from "@/features/routes/components/route-map"

interface AdminSeatMapProps {
    trip: TripDetail
}

export function AdminSeatMap({ trip }: AdminSeatMapProps) {
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(
        trip.train?.coaches?.[0]?.id || null
    )
    const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    // Passenger Search Dialog State
    const [isPassengerDialogOpen, setIsPassengerDialogOpen] = useState(false)
    const [highlightedSeatId, setHighlightedSeatId] = useState<string | null>(null)

    const { socket } = useSocketStore()
    const queryClient = useQueryClient()

    // Use full route for price context (or just standard view)
    // Use full route for price context (or just standard view)
    const [fromStationId, setFromStationId] = useState<string>(
        trip.route?.stations?.[0]?.stationId || ""
    )
    const [toStationId, setToStationId] = useState<string>(
        trip.route?.stations?.[trip.route.stations.length - 1]?.stationId || ""
    )

    const orderedStations = [...(trip.route?.stations || [])].sort((a, b) => a.index - b.index)

    const handleStationClick = (stationId: string) => {
        const clickedIndex = orderedStations.findIndex((s) => s.stationId === stationId)
        if (clickedIndex === -1 || orderedStations.length < 2) return

        const fromIndex = orderedStations.findIndex((s) => s.stationId === fromStationId)
        const toIndex = orderedStations.findIndex((s) => s.stationId === toStationId)

        if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
            const safeFromIndex = Math.min(clickedIndex, orderedStations.length - 2)
            setFromStationId(orderedStations[safeFromIndex].stationId)
            setToStationId(orderedStations[safeFromIndex + 1].stationId)
            return
        }

        // Click on/left of A moves A, click right of A moves B.
        if (clickedIndex <= fromIndex) {
            const safeFromIndex = Math.min(clickedIndex, orderedStations.length - 2)
            setFromStationId(orderedStations[safeFromIndex].stationId)
            if (toIndex <= safeFromIndex) {
                setToStationId(orderedStations[safeFromIndex + 1].stationId)
            }
            return
        }

        setToStationId(orderedStations[clickedIndex].stationId)
    }

    const { data: coachWithPrices, isLoading: isCoachLoading } = useCoachWithPrices(
        {
            coachId: selectedCoachId || '',
            tripId: trip.id,
            fromStationId,
            toStationId,
        },
        !!selectedCoachId && !!trip.id
    )

    // Listen for booking updates to refresh seat map
    useEffect(() => {
        if (!socket) return

        function onSeatsBooked(data: { tripId: string, seatIds: string[] }) {
            if (data.tripId === trip.id) {
                // Invalidate query to refetch latest status
                queryClient.invalidateQueries({
                    queryKey: ['coaches']
                })
                toast.success("Dữ liệu ghế đã được cập nhật mới")
            }
        }

        socket.on("seats.booked", onSeatsBooked)

        return () => {
            socket.off("seats.booked", onSeatsBooked)
        }
    }, [socket, trip.id, queryClient])

    const handleSeatClick = (seat: Seat) => {
        setSelectedSeat(seat)
        setIsDetailOpen(true)
    }

    // Aggregate all passengers from all coaches
    const allPassengers: PassengerInfo[] = []
    if (trip.train?.coaches) {
        // We need to fetch all coaches' seats to get passenger data
        // For now, we'll use the current coach data from coachWithPrices
        // In a real implementation, you might want to fetch all coaches at once
        if (coachWithPrices?.seats) {
            const passengers = (coachWithPrices.seats as Seat[])
                .filter(seat => seat.passenger && (seat.bookingStatus === 'BOOKED' || seat.bookingStatus === 'HOLDING'))
                .map(seat => ({
                    id: seat.id,
                    name: seat.passenger!.name,
                    cccd: seat.passenger!.id,
                    seatId: seat.id,
                    seatName: seat.name,
                    coachId: selectedCoachId || '',
                    coachName: coachWithPrices.name,
                    status: seat.bookingStatus as 'BOOKED' | 'HOLDING',
                }))
            allPassengers.push(...passengers)
        }
    }

    const handlePassengerClick = (seatId: string, coachId: string) => {
        // Switch to the correct coach if needed
        if (coachId !== selectedCoachId) {
            setSelectedCoachId(coachId)
        }

        // Highlight and scroll to the seat
        setHighlightedSeatId(seatId)

        // Clear highlight after 3 seconds
        setTimeout(() => {
            setHighlightedSeatId(null)
        }, 3000)
    }

    return (
        <Card className="rounded-[2rem] border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="p-6 pb-2 relative z-10">
                <CardTitle className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Sơ đồ & Quản lý ghế</CardTitle>
                <CardDescription className="text-[10px] font-medium text-muted-foreground/60">
                    Xem trạng thái, khóa/mở ghế và quản lý bảo trì cho chuyến {trip.train?.code}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
                <div className="space-y-6 min-w-0">
                    {/* Stations & Coach Navi */}
                    <div className="space-y-4 border-b pb-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="flex-1 w-full space-y-2">
                                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Ga đi</Label>
                                <Select value={fromStationId} onValueChange={(val) => {
                                    setFromStationId(val)
                                    // Reset To Station if it becomes invalid (before From Station)
                                    const fromIndex = trip.route?.stations?.findIndex(s => s.stationId === val) ?? -1
                                    const toIndex = trip.route?.stations?.findIndex(s => s.stationId === toStationId) ?? -1
                                    if (fromIndex >= toIndex) {
                                        // Default to the next station or empty
                                        const nextStation = trip.route?.stations?.[fromIndex + 1]
                                        if (nextStation) setToStationId(nextStation.stationId)
                                    }
                                }}>
                                    <SelectTrigger className="w-full h-11 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800 shadow-sm transition-all focus:ring-rose-500/20">
                                        <SelectValue placeholder="Chọn ga đi" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 dark:border-zinc-800 shadow-2xl">
                                        {orderedStations.map((s, index) => (
                                            // Hide last station as From Station
                                            index < orderedStations.length - 1 && (
                                                <SelectItem key={s.stationId} value={s.stationId} className="rounded-xl">
                                                    {s.station.name}
                                                </SelectItem>
                                            )
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 w-full space-y-2">
                                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Ga đến</Label>
                                <Select value={toStationId} onValueChange={setToStationId}>
                                    <SelectTrigger className="w-full h-11 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800 shadow-sm transition-all focus:ring-rose-500/20">
                                        <SelectValue placeholder="Chọn ga đến" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 dark:border-zinc-800 shadow-2xl">
                                        {orderedStations.map((s, index) => {
                                            const fromIndex = orderedStations.findIndex(st => st.stationId === fromStationId)
                                            // Only show stations AFTER From Station
                                            if (index > fromIndex) {
                                                return (
                                                    <SelectItem key={s.stationId} value={s.stationId} className="rounded-xl">
                                                        {s.station.name}
                                                    </SelectItem>
                                                )
                                            }
                                            return null
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Chọn nhanh trên bản đồ</Label>
                            <div className="rounded-[1.5rem] overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-inner">
                                <RouteMap
                                    stations={orderedStations}
                                    className="h-[300px]"
                                    pathCoordinates={trip.route?.pathCoordinates}
                                    selectedFromStationId={fromStationId}
                                    selectedToStationId={toStationId}
                                    onStationClick={handleStationClick}
                                    highlightSegment={{
                                        fromStationId,
                                        toStationId,
                                    }}
                                />
                            </div>
                        </div>

                        <BookingCoachNavigationBar
                            coaches={trip.train?.coaches || []}
                            selectedCoachId={selectedCoachId}
                            onCoachSelect={setSelectedCoachId}
                            trainCode={trip.train?.code || ""}
                        />
                    </div>

                    {/* Seat Map */}
                    <div className="min-h-[400px]">
                        {!selectedCoachId ? (
                            <div className="flex items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                                Vui lòng chọn toa để xem sơ đồ
                            </div>
                        ) : isCoachLoading ? (
                            <div className="flex items-center justify-center h-60">
                                <Spinner className="w-8 h-8" />
                            </div>
                        ) : coachWithPrices ? (
                            <div>
                                {coachWithPrices.template.layout === 'SEAT' ? (
                                    <SeatLayoutViewer
                                        seats={coachWithPrices.seats}
                                        template={coachWithPrices.template}
                                        onSeatClick={handleSeatClick}
                                        tripId={trip.id}
                                        isAdmin={true}
                                        selectedSeats={[]}
                                        highlightedSeatIds={highlightedSeatId ? [highlightedSeatId] : []}
                                        focusedSeatId={highlightedSeatId}
                                        coachName={coachWithPrices.name}
                                        onSearchPassenger={() => setIsPassengerDialogOpen(true)}
                                    />
                                ) : (
                                    <BedLayoutViewer
                                        seats={coachWithPrices.seats}
                                        template={coachWithPrices.template}
                                        onSeatClick={handleSeatClick}
                                        tripId={trip.id}
                                        isAdmin={true}
                                        selectedSeats={[]}
                                        highlightedSeatIds={highlightedSeatId ? [highlightedSeatId] : []}
                                        focusedSeatId={highlightedSeatId}
                                        coachName={coachWithPrices.name}
                                        onSearchPassenger={() => {
                                            setIsPassengerDialogOpen(true)
                                            // Optional: Add a hidden button with a data-attribute for easier query if needed, 
                                            // but we'll use a better approach in the parent.
                                        }}
                                        {...({'data-search-passenger': 'true'} as any)}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                Không có dữ liệu ghế cho toa này
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Seat Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 [&>button:last-child]:hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Thông tin Chi tiết</DialogTitle>
                        <DialogDescription className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest pt-1">
                            {trip.train?.code} • Toa {coachWithPrices?.name} • Ghế {selectedSeat?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSeat && (
                        <div className="px-6 pb-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                                    <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Trạng thái</div>
                                    <Badge variant={selectedSeat.bookingStatus === 'BOOKED' ? 'default' : 'outline'} className={cn(
                                        "rounded-full px-3 py-0.5 text-[10px] font-bold border-none shadow-sm",
                                        selectedSeat.bookingStatus === 'BOOKED' ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                                    )}>
                                        {selectedSeat.bookingStatus === 'BOOKED' ? 'Đã bán' :
                                            selectedSeat.bookingStatus === 'HOLDING' ? 'Đang giữ' : 'Còn trống'}
                                    </Badge>
                                </div>
                                <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                                    <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Giá vé chặng này</div>
                                    <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedSeat.price)}
                                    </div>
                                </div>
                            </div>

                            {selectedSeat.passenger ? (
                                <div className="rounded-2xl p-6 bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/20 space-y-4">
                                    <div className="font-bold text-xs text-[#802222] dark:text-rose-400 flex items-center gap-2 uppercase tracking-tight">
                                        <Users className="w-4 h-4 opacity-40" />
                                        Thông tin hành khách
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Họ và tên</div>
                                            <div className="font-bold text-base text-zinc-800 dark:text-zinc-200">{selectedSeat.passenger.name}</div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">CCCD/CMND</div>
                                            <div className="font-bold text-zinc-600 dark:text-zinc-400 tracking-widest">{selectedSeat.passenger.id}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-700">
                                    <p className="text-xs font-medium text-zinc-400">Ghế chưa có thông tin hành khách (Chưa bán)</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Passenger Search Dialog */}
            <PassengerSearchDialog
                open={isPassengerDialogOpen}
                onOpenChange={setIsPassengerDialogOpen}
                passengers={allPassengers}
                onPassengerClick={handlePassengerClick}
            />

            <div className="absolute -right-12 -top-12 w-48 h-48 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-3xl z-0" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-3xl z-0" />
        </Card>
    )
}

