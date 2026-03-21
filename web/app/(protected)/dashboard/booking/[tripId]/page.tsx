'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format, addMinutes } from 'date-fns';
import { ArrowLeft, Train, MapPin, Clock, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

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
            <div className="container mx-auto py-8 px-4 space-y-6">
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Card className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </Card>
                </div>
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
                    router.push(`/dashboard/booking/passengers?bookingCode=${data.bookingCode}`);
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
        <div className="flex flex-1 flex-col gap-4">
            <div className="">
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

            <Button 
                variant="ghost" 
                onClick={() => router.back()} 
                className="mb-8 group hover:bg-rose-50 hover:text-[#802222] rounded-xl transition-all font-medium text-sm px-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Quay lại
            </Button>

            {/* Trip Info */}
            <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] p-5 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-zinc-800 relative overflow-hidden group mb-6">
                <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-[#802222] dark:text-rose-400">
                            <Train className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-muted-foreground mb-1">Chi tiết chuyến</p>
                            <h2 className="text-xl font-bold text-[#802222] dark:text-rose-400 leading-none">{trip.route.name}</h2>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-[#802222]/20 text-[#802222] dark:text-rose-400 font-medium px-3 py-1 rounded-full text-[11px]">
                        Tàu {trip.train.code}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-medium text-muted-foreground opacity-60">Ga đi</p>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#802222]/40" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">{fromStation?.station.name}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-medium text-muted-foreground opacity-60">Ga đến</p>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#802222]/40" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">{toStation?.station.name}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-medium text-muted-foreground opacity-60">Khởi hành</p>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-[#802222]/40" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-white tabular-nums">{format(departureDate, 'HH:mm dd/MM')}</span>
                        </div>
                    </div>
                    {arrivalDate && (
                        <div className="flex flex-col gap-1">
                            <p className="text-[11px] font-medium text-muted-foreground opacity-60">Dự kiến đến</p>
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-[#802222]/40" />
                                <span className="font-semibold text-sm text-gray-900 dark:text-white tabular-nums">{format(arrivalDate, 'HH:mm dd/MM')}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Decorative element */}
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-rose-50/40 dark:bg-rose-950/5 rounded-full blur-3xl -z-0" />
            </div>

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
                            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-xl shadow-gray-100 border border-gray-100 dark:border-zinc-800">
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400">Chọn chỗ</h3>
                                    <p className="text-[11px] font-medium text-muted-foreground mt-1">
                                        Chọn toa và chỗ ngồi/giường của bạn
                                    </p>
                                </div>
                                <div>
                                    {/* Coach Navigation */}
                                    <div className="mb-8 p-1 bg-gray-50/50 dark:bg-zinc-800/50 rounded-2xl">
                                        <BookingCoachNavigationBar
                                            coaches={trip.train.coaches}
                                            selectedCoachId={selectedCoachId}
                                            onCoachSelect={setSelectedCoachId}
                                            trainCode={trip.train.code}
                                        />
                                    </div>

                                    {!selectedCoachId ? (
                                        <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-gray-100 rounded-[1.5rem] bg-gray-50/30">
                                            <p className="text-sm font-medium opacity-50">Vui lòng chọn toa để xem sơ đồ chỗ ngồi</p>
                                        </div>
                                    ) : isCoachLoading ? (
                                        <div className="space-y-6">
                                            <div className="flex justify-center gap-4">
                                                <Skeleton className="h-10 w-24 rounded-full" />
                                                <Skeleton className="h-10 w-24 rounded-full" />
                                                <Skeleton className="h-10 w-24 rounded-full" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                                                ))}
                                            </div>
                                        </div>
                                    ) : coachWithPrices ? (
                                        <div className="bg-gray-50/30 dark:bg-zinc-800/30 rounded-[1.5rem] p-4 border border-gray-50 dark:border-zinc-800">
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
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Desktop */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-6 space-y-4">
                                {/* Route Map */}
                                {trip.route.stations && trip.route.stations.length > 0 && (
                                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-zinc-800 overflow-hidden group">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-[#802222] dark:text-rose-400">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-[#802222] dark:text-rose-400">
                                                LỘ TRÌNH
                                            </h3>
                                        </div>
                                        <div className="rounded-[1.2rem] overflow-hidden border border-gray-50 dark:border-zinc-800 h-[220px]">
                                            <RouteMap
                                                stations={trip.route.stations.map((s: any, i: number) => ({ ...s, index: i }))}
                                                className="h-full border-0"
                                                highlightSegment={fromStationId && toStationId ? {
                                                    fromStationId: fromStationId,
                                                    toStationId: toStationId
                                                } : undefined}
                                                pathCoordinates={trip.route.pathCoordinates}
                                            />
                                        </div>
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
                                pathCoordinates={trip.route.pathCoordinates}
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
                                    {isInitializing || isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        </div>
                                    ) : 'Tiếp tục'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
            </div>
        </div>
    );
}
