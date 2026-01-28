'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, addMinutes } from 'date-fns';
import { ArrowLeft, Train, MapPin, Clock, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useTrip } from '@/features/trips/hooks/use-trips';
import { useCoachWithPrices } from '@/features/booking/hooks/use-coach-with-prices';
import { useInitBooking } from '@/features/booking/hooks/use-init-booking';

import { SeatLayoutViewer } from '@/features/booking/components/seat-layout-viewer';
import { RouteMap } from '@/features/routes/components/route-map';
import { BedLayoutViewer } from '@/features/booking/components/bed-layout-viewer';
import { BookingCoachNavigationBar } from '@/features/booking/components/booking-coach-navigation-bar';
import { BookingSummary } from '@/features/booking/components/booking-summary';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { ChevronUp } from 'lucide-react';
import { ConflictDialog } from '@/features/booking/components/conflict-dialog';
import { MaxPendingDialog } from '@/features/booking/components/max-pending-dialog';

export default function TripDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const tripId = params.tripId as string;
    const fromStationId = searchParams.get('from') || '';
    const toStationId = searchParams.get('to') || '';


    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Array<{ id: string; name: string; price: number; type: string }>>([]);
    const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");
    const [isMaxPendingDialogOpen, setIsMaxPendingDialogOpen] = useState(false);
    const [pendingError, setPendingError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);

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
        const isSelected = selectedSeats.some((s) => s.id === seat.id);

        if (isSelected) {
            setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
            return;
        }

        if (selectedSeats.length >= 6) {
            toast.warning("Mỗi đơn hàng chỉ được chọn tối đa 6 ghế");
            return;
        }

        const type = coachWithPrices?.template.layout ?? 'SEAT';
        setSelectedSeats((prev) => [...prev, { id: seat.id, name: seat.name, price: seat.price, type }]);
    };

    const handleRemoveSeat = (seatId: string) => {
        setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
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
                    router.push(`/booking/passengers?bookingCode=${data.bookingCode}`);
                    // NOTE: Do NOT set isProcessing to false here. 
                    // We want it to remain true while the redirect happens to prevent 
                    // the socket event from triggering a false conflict with our own locks.
                },
                onError: (error: any) => {
                    console.error('Init booking failed:', error);
                    const message = error.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.';

                    // Check keywords for both: 
                    // 1. "Bạn đang giữ quá nhiều đơn chưa thanh toán (Tối đa 3 đơn)..."
                    // 2. "Bạn đã có một đơn hàng đang chờ thanh toán cho chuyến này..."
                    if (message.includes("Tối đa 3") || message.includes("chờ thanh toán") || message.includes("chưa thanh toán")) {
                        setPendingError(message);
                        setIsMaxPendingDialogOpen(true);
                    } else {
                        toast.error(message);
                    }
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

            <MaxPendingDialog
                open={isMaxPendingDialogOpen}
                onOpenChange={setIsMaxPendingDialogOpen}
                message={pendingError}
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

            {/* Error Banner for non-SCHEDULED trips */}
            {trip.status !== 'SCHEDULED' && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Chuyến tàu không khả dụng</AlertTitle>
                    <AlertDescription>
                        {trip.status === 'IN_PROGRESS' && 'Chuyến tàu đã khởi hành.'}
                        {trip.status === 'COMPLETED' && 'Chuyến tàu đã hoàn thành.'}
                        {trip.status === 'CANCELLED' && 'Chuyến tàu đã bị hủy.'}
                        {' '}Vui lòng chọn chuyến khác.
                    </AlertDescription>
                </Alert>
            )}

            {/* Seat Selection - Only show if SCHEDULED */}
            {trip.status === 'SCHEDULED' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 lg:pb-0">
                        <div className="lg:col-span-2 space-y-6">
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
                            </Card>
                        </div>

                        {/* Right Column - Desktop */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-6 space-y-4">
                                {/* Route Map */}
                                {trip.route.stations && trip.route.stations.length > 0 && (
                                    <div className="rounded-lg border overflow-hidden bg-card shadow-sm">
                                        <RouteMap
                                            stations={trip.route.stations.map((s: any, i: number) => ({ ...s, index: i }))}
                                            className="h-[250px]"
                                            highlightSegment={fromStationId && toStationId ? {
                                                fromStationId: fromStationId,
                                                toStationId: toStationId
                                            } : undefined}
                                        />
                                    </div>
                                )}

                                <BookingSummary
                                    selectedSeats={selectedSeats}
                                    onRemoveSeat={handleRemoveSeat}
                                    onProceed={handleProceedToPassengerInfo}
                                    isProcessing={isProcessing || isInitializing}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )
            }

            {/* Mobile Map Dialog */}
            <Dialog open={isMobileMapOpen} onOpenChange={setIsMobileMapOpen}>
                <DialogContent className="max-w-[95vw] w-full p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Bản đồ lộ trình</DialogTitle>
                    <div className="h-[60vh] w-full">
                        {trip.route.stations && trip.route.stations.length > 0 && (
                            <RouteMap
                                stations={trip.route.stations.map((s: any, i: number) => ({ ...s, index: i }))}
                                className="h-full border-0"
                                highlightSegment={fromStationId && toStationId ? {
                                    fromStationId: fromStationId,
                                    toStationId: toStationId
                                } : undefined}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Mobile Map Floating Button */}
            <div className={`fixed right-4 z-40 lg:hidden transition-all duration-300 ${selectedSeats.length > 0 ? 'bottom-24' : 'bottom-4'
                }`}>
                <Button
                    size="icon"
                    className="rounded-full h-12 w-12 shadow-lg"
                    onClick={() => setIsMobileMapOpen(true)}
                >
                    <MapPin className="h-6 w-6" />
                </Button>
            </div>
            {/* Mobile Sticky Footer */}
            {
                selectedSeats.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1" onClick={() => setIsDetailsOpen(true)}>
                                    <span className="text-sm font-medium">Đã chọn {selectedSeats.length} chỗ</span>
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-xl font-bold text-primary">
                                    {totalPrice.toLocaleString('vi-VN')} ₫
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-h-[80vh] overflow-y-auto p-0 gap-0">
                                        <DialogTitle className="sr-only">Chi tiết đặt chỗ</DialogTitle>
                                        <BookingSummary
                                            selectedSeats={selectedSeats}
                                            onRemoveSeat={handleRemoveSeat}
                                            onProceed={() => {
                                                setIsDetailsOpen(false);
                                                handleProceedToPassengerInfo();
                                            }}
                                            isProcessing={isProcessing || isInitializing}
                                            className="border-0 shadow-none"
                                        />
                                    </DialogContent>
                                </Dialog>

                                <Button
                                    size="lg"
                                    onClick={handleProceedToPassengerInfo}
                                    disabled={isInitializing || isProcessing}
                                >
                                    {isInitializing || isProcessing ? '...' : 'Tiếp tục'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
