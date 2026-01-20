'use client';

import { useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Train, MapPin, Clock, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTrip } from '@/features/trips/hooks/use-trips';
import { useCoachWithPrices } from '@/features/booking/hooks/use-coach-with-prices';
import { SeatLayoutViewer } from '@/features/booking/components/seat-layout-viewer';
import { BedLayoutViewer } from '@/features/booking/components/bed-layout-viewer';
import { BookingCoachNavigationBar } from '@/features/booking/components/booking-coach-navigation-bar';

export default function TripDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const tripId = params.tripId as string;
    const fromStationId = searchParams.get('from') || '';
    const toStationId = searchParams.get('to') || '';

    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Array<{ id: string; price: number }>>([]);

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

    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

    const handleSeatToggle = (seatId: string, price: number) => {
        setSelectedSeats((prev) => {
            const exists = prev.find((s) => s.id === seatId);
            if (exists) {
                return prev.filter((s) => s.id !== seatId);
            }
            return [...prev, { id: seatId, price }];
        });
    };

    const handleProceedToPayment = () => {
        // TODO: Navigate to payment page with selected seats
        console.log('Proceed to payment with seats:', selectedSeats);
    };

    return (
        <div className="container mx-auto py-8">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <p className="font-semibold">{format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Coach Navigation & Seat Selection */}
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
                                        onSeatClick={(seat) => handleSeatToggle(seat.id, seat.price)}
                                    />
                                ) : (
                                    <BedLayoutViewer
                                        seats={coachWithPrices.seats}
                                        template={coachWithPrices.template}
                                        selectedSeats={selectedSeats.map((s) => s.id)}
                                        onSeatClick={(seat) => handleSeatToggle(seat.id, seat.price)}
                                    />
                                )}

                                <Separator className="my-6" />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Đã chọn {selectedSeats.length} chỗ</p>
                                        <p className="text-2xl font-bold">
                                            {totalPrice.toLocaleString('vi-VN')} ₫
                                        </p>
                                    </div>
                                    <Button
                                        size="lg"
                                        disabled={selectedSeats.length === 0}
                                        onClick={handleProceedToPayment}
                                    >
                                        Tiếp tục thanh toán
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
