'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBooking } from '@/features/booking/hooks/use-booking';
import { useUpdateBookingPassengers } from '@/features/booking/hooks/use-update-booking-passengers';
import { PassengerFormData, PassengerInfoForm } from '@/features/booking/components/passenger-info-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, addMinutes } from 'date-fns';
import { useTrip } from '@/features/trips/hooks/use-trips';

function PassengersPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingCode = searchParams.get('bookingCode');

    const { data: booking, isLoading: isBookingLoading } = useBooking(bookingCode, !!bookingCode);
    const { mutate: updatePassengers, isPending: isUpdating } = useUpdateBookingPassengers();

    const [seats, setSeats] = useState<Array<{ id: string; name: string; price: number }>>([]);
    const [initialPassengers, setInitialPassengers] = useState<PassengerFormData[]>([]);

    useEffect(() => {
        if (booking?.metadata?.seats) {
            setSeats(booking.metadata.seats);
        }

        if (booking?.metadata?.passengers) {
            // Map existing passengers to form data format
            const existingPassengers = booking.metadata.passengers.map((p: any) => ({
                seatId: p.seatId,
                seatName: '', // Will be matched with seats via seatId in form
                passengerName: p.passengerName,
                passengerId: p.passengerId,
                passengerGroupId: p.passengerGroupId,
                ageCategory: (p.passengerId === 'N/A' || !p.passengerId) ? 'child' : 'adult',
            }));
            setInitialPassengers(existingPassengers as PassengerFormData[]);
        }
    }, [booking]);

    if (!bookingCode) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Không tìm thấy mã đơn hàng
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isBookingLoading) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Đang tải thông tin đơn hàng...
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        Không tìm thấy đơn hàng
                    </CardContent>
                </Card>
            </div>
        );
    }

    const trip = booking.trip;
    const fromStationId = booking.metadata?.fromStationId;
    const toStationId = booking.metadata?.toStationId;

    const fromStation = trip.route.stations.find((rs: any) => rs.stationId === fromStationId);
    const toStation = trip.route.stations.find((rs: any) => rs.stationId === toStationId);

    const departureDate = trip.departureTime && fromStation
        ? addMinutes(new Date(trip.departureTime), fromStation.durationFromStart)
        : new Date(trip.departureTime);

    // Calculate arrival date (placeholder logic, adjust as needed)
    const arrivalDate = trip.departureTime && toStation
        ? addMinutes(new Date(trip.departureTime), toStation.durationFromStart)
        : null;

    const handleSubmit = (passengers: PassengerFormData[]) => {
        updatePassengers(
            {
                code: bookingCode,
                passengers: passengers.map(p => ({
                    seatId: p.seatId,
                    passengerName: p.passengerName,
                    passengerId: p.passengerId,
                    passengerGroupId: p.passengerGroupId,
                }))
            },
            {
                onSuccess: (data) => {
                    window.location.href = data.paymentUrl;
                },
                onError: (error) => {
                    console.error('Booking failed:', error);
                    toast.error('Có lỗi xảy ra khi cập nhật thông tin hành khách');
                }
            }
        );
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
            </Button>

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
                                <p className="font-semibold">{fromStation?.station?.name || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Ga đến</p>
                                <p className="font-semibold">{toStation?.station?.name || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Khởi hành</p>
                                <p className="font-semibold">{format(departureDate, 'HH:mm dd/MM/yyyy')}</p>
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>

            <PassengerInfoForm
                seats={seats}
                initialPassengers={initialPassengers}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                submitLabel={isUpdating ? "Đang xử lý..." : "Thanh toán"}
            />
        </div>
    );
}

export default function PassengersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PassengersPageContent />
        </Suspense>
    );
}
