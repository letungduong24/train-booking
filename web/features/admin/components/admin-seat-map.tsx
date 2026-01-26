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
        <Card>
            <CardHeader>
                <CardTitle>Sơ đồ & Quản lý ghế</CardTitle>
                <CardDescription>
                    Xem trạng thái, khóa/mở ghế và quản lý bảo trì cho chuyến {trip.train?.code}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Stations & Coach Navi */}
                    <div className="space-y-4 border-b pb-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Ga đi</Label>
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
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn ga đi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trip.route?.stations.map((s, index) => (
                                            // Hide last station as From Station
                                            index < (trip.route?.stations.length || 0) - 1 && (
                                                <SelectItem key={s.stationId} value={s.stationId}>
                                                    {s.station.name}
                                                </SelectItem>
                                            )
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label>Ga đến</Label>
                                <Select value={toStationId} onValueChange={setToStationId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn ga đến" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trip.route?.stations.map((s, index) => {
                                            const fromIndex = trip.route?.stations?.findIndex(st => st.stationId === fromStationId) ?? -1
                                            // Only show stations AFTER From Station
                                            if (index > fromIndex) {
                                                return (
                                                    <SelectItem key={s.stationId} value={s.stationId}>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thông tin Chi tiết</DialogTitle>
                        <DialogDescription>
                            {trip.train?.code} - Toa {coachWithPrices?.name} - {selectedSeat?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSeat && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Trạng thái</div>
                                    <Badge variant={selectedSeat.bookingStatus === 'BOOKED' ? 'default' : 'outline'}>
                                        {selectedSeat.bookingStatus === 'BOOKED' ? 'Đã bán' :
                                            selectedSeat.bookingStatus === 'HOLDING' ? 'Đang giữ' : 'Còn trống'}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Giá vé chặng này</div>
                                    <div className="font-semibold text-green-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedSeat.price)}
                                    </div>
                                </div>
                            </div>

                            {selectedSeat.passenger ? (
                                <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                                    <div className="font-semibold flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        Thông tin hành khách
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-muted-foreground">Họ và tên:</div>
                                        <div className="font-medium">{selectedSeat.passenger.name}</div>

                                        <div className="text-muted-foreground">CCCD/CMND:</div>
                                        <div className="font-medium">{selectedSeat.passenger.id}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">
                                    Ghế chưa có thông tin hành khách (Chưa bán)
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

            {/* Floating Action Button */}
            <Button
                onClick={() => setIsPassengerDialogOpen(true)}
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50"
                size="icon"
                title="Tìm kiếm hành khách"
            >
                <div className="relative">
                    <Users className="h-6 w-6" />
                    {allPassengers.length > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {allPassengers.length}
                        </Badge>
                    )}
                </div>
            </Button>
        </Card>
    )
}

