'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, addMinutes } from 'date-fns';
import { ArrowLeft, Train, MapPin, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTrip } from '@/features/trips/hooks/use-trips';
import { useCoachWithPrices } from '@/features/booking/hooks/use-coach-with-prices';
import { useInitBooking } from '@/features/booking/hooks/use-init-booking';
import { useBooking } from '@/features/booking/hooks/use-booking';
import { SeatLayoutViewer } from '@/features/booking/components/seat-layout-viewer';
import { BedLayoutViewer } from '@/features/booking/components/bed-layout-viewer';
import { BookingCoachNavigationBar } from '@/features/booking/components/booking-coach-navigation-bar';
import { ConflictDialog } from '@/features/booking/components/conflict-dialog';

export default function TripDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const tripId = params.tripId as string;
    const fromStationId = searchParams.get('from') || '';
    const toStationId = searchParams.get('to') || '';
    const bookingCodeParam = searchParams.get('bookingCode');


    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Array<{ id: string; name: string; price: number }>>([]);
    const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch booking if bookingCode exists in URL to restore seat selection
    const { data: existingBooking, isLoading: isLoadingBooking } = useBooking(bookingCodeParam, !!bookingCodeParam);

    // Restore seat selection from existing booking or redirect if ready
    useEffect(() => {
        if (!existingBooking || isLoadingBooking) return;

        const metadata = existingBooking.metadata;
        if (!metadata) return;

        // If passengers already filled, redirect to passengers page (which handles next steps)
        if (metadata.passengers && metadata.passengers.length > 0) {
            router.push(`/onboard/booking/passengers?bookingCode=${existingBooking.code}`);
        } else if (metadata.seats && metadata.seats.length > 0) {
            // Restore seats
            setSelectedSeats(metadata.seats);
        }
    }, [existingBooking, isLoadingBooking, router]);

    const { data: trip, isLoading: isTripLoading } = useTrip(tripId);

    const { data: coachWithPrices, isLoading: isCoachLoading } = useCoachWithPrices(
        {
            coachId: selectedCoachId || '',
            tripId,
            fromStationId,
            toStationId,
        },
        !!selectedCoachId
    );

    const { mutate: initBooking, isPending: isInitializing } = useInitBooking();

    if (isTripLoading) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Đang tải thông tin chuyến tàu...
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Không tìm thấy chuyến tàu
                    </CardContent>
                </Card>
            </div>
        );
    }

    const fromStation = trip.route.stations.find((rs: any) => rs.stationId === fromStationId);
    const toStation = trip.route.stations.find((rs: any) => rs.stationId === toStationId);

    const departureDate = trip.departureTime && fromStation
        ? addMinutes(new Date(trip.departureTime), fromStation.durationFromStart)
        : new Date(trip.departureTime);

    const arrivalDate = trip.departureTime && toStation
        ? addMinutes(new Date(trip.departureTime), toStation.durationFromStart)
        : null;

    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);



    const handleSeatToggle = (seat: any) => {
        setSelectedSeats((prev) => {
            const exists = prev.find((s) => s.id === seat.id);
            if (exists) {
                return prev.filter((s) => s.id !== seat.id);
            }
            return [...prev, { id: seat.id, name: seat.name, price: seat.price }];
        });
    };

    const handleSeatsForceDeselected = (seatIds: string[]) => {
        // Remove conflicted seats from selection
        setSelectedSeats(prev => prev.filter(s => !seatIds.includes(s.id)));
        setConflictMessage(`Các ghế sau vừa được người khác giữ chỗ: ${seatIds.map(id => selectedSeats.find(s => s.id === id)?.name || 'Ghế').join(', ')}`);
        setIsConflictDialogOpen(true);
    };

    const handleProceedToPassengerInfo = () => {
        if (selectedSeats.length > 0) {
            setIsProcessing(true);
            initBooking({
                tripId,
                seatIds: selectedSeats.map(s => s.id),
                fromStationId,
                toStationId
            }, {
                onSuccess: (data) => {
                    console.log('Booking initialized:', data);
                    // Navigate to passengers page instead of showing form
                    router.push(`/onboard/booking/passengers?bookingCode=${data.bookingCode}`);
                    // NOTE: Do NOT set isProcessing to false here. 
                    // We want it to remain true while the redirect happens to prevent 
                    // the socket event from triggering a false conflict with our own locks.
                },
                onError: (error: any) => {
                    console.error('Init booking failed:', error);
                    const message = error.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.';
                    toast.error(message);
                    setIsProcessing(false);
                }
            });
        }
    };

    // Remove old form handler and cancellation

    return (
        <div className="container mx-auto py-8 px-4">
            <ConflictDialog
                open={isConflictDialogOpen}
                onOpenChange={setIsConflictDialogOpen}
                onConfirm={() => setIsConflictDialogOpen(false)}
                description={conflictMessage}
            />

            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
            </Button>

            {/* Trip Info */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{trip.route.name}</CardTitle>
                            <CardDescription>Tàu {trip.train.code}</CardDescription>
                        </div>
                        <Badge variant={trip.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                            {trip.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Ga đi</p>
                                <p className="font-semibold">{fromStation?.station.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Ga đến</p>
                                <p className="font-semibold">{toStation?.station.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Khởi hành</p>
                                <p className="font-semibold">{format(departureDate, 'HH:mm dd/MM/yyyy')}</p>
                            </div>
                        </div>
                        {arrivalDate && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Về đích</p>
                                    <p className="font-semibold">{format(arrivalDate, 'HH:mm dd/MM/yyyy')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Seat Selection */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Chọn chỗ</CardTitle>
                        <CardDescription>
                            Chọn toa và chỗ ngồi/giường của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Coach Navigation */}
                        <div className="mb-8">
                            <BookingCoachNavigationBar
                                coaches={trip.train.coaches}
                                selectedCoachId={selectedCoachId}
                                onCoachSelect={setSelectedCoachId}
                                trainCode={trip.train.code}
                            />
                        </div>

                        {!selectedCoachId ? (
                            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Vui lòng chọn toa để xem sơ đồ chỗ ngồi
                            </div>
                        ) : isCoachLoading ? (
                            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Đang tải sơ đồ chỗ ngồi...
                            </div>
                        ) : coachWithPrices ? (
                            <div>
                                {coachWithPrices.template.layout === 'SEAT' ? (
                                    <SeatLayoutViewer
                                        seats={coachWithPrices.seats}
                                        template={coachWithPrices.template}
                                        selectedSeats={selectedSeats.map((s) => s.id)}
                                        onSeatClick={handleSeatToggle}
                                        tripId={tripId}
                                        onSeatsForceDeselected={handleSeatsForceDeselected}
                                        isSubmitting={isProcessing || isInitializing}
                                    />
                                ) : (
                                    <BedLayoutViewer
                                        seats={coachWithPrices.seats}
                                        template={coachWithPrices.template}
                                        selectedSeats={selectedSeats.map((s) => s.id)}
                                        onSeatClick={handleSeatToggle}
                                        tripId={tripId}
                                        onSeatsForceDeselected={handleSeatsForceDeselected}
                                        isSubmitting={isProcessing || isInitializing}
                                    />
                                )}

                            </div>
                        ) : null}

                    </CardContent>
                    {selectedSeats.length > 0 && (
                        <CardFooter className="sticky bottom-0 bg-background z-10 border-t pt-6 justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                            <div>
                                <p className="text-sm text-muted-foreground">Đã chọn {selectedSeats.length} chỗ</p>
                                <p className="text-2xl font-bold">
                                    {totalPrice.toLocaleString('vi-VN')} ₫
                                </p>
                            </div>
                            <Button
                                size="lg"
                                onClick={handleProceedToPassengerInfo}
                                disabled={isInitializing || isProcessing}
                            >
                                {isInitializing || isProcessing ? 'Đang xử lý...' : 'Tiếp tục'}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
