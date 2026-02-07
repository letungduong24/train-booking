'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useBooking } from '@/features/booking/hooks/use-booking';
import { useUpdateBookingPassengers } from '@/features/booking/hooks/use-update-booking-passengers';
import { PassengerInfoForm } from '@/features/booking/components/passenger-info-form';
import { PaymentMethodDialog } from '@/features/booking/components/payment-method-dialog';
import { PassengerFormData } from '@/lib/schemas/booking.schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, addMinutes } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
// import { socket } from '@/lib/socket';

function PassengersPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingCode = searchParams.get('bookingCode');
    const queryClient = useQueryClient();

    const { data: booking, isLoading: isBookingLoading } = useBooking(bookingCode, !!bookingCode);
    const { mutate: updatePassengers, isPending: isUpdating } = useUpdateBookingPassengers();

    const [seats, setSeats] = useState<Array<{ id: string; name: string; price: number }>>([]);
    const [initialPassengers, setInitialPassengers] = useState<PassengerFormData[]>([]);
    const [paymentDialog, setPaymentDialog] = useState({ open: false, amount: 0, paymentUrl: '', bookingCode: '' });

    // Socket logic moved to useBooking hook

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

    // Redirect if not PENDING
    // Redirect if not PENDING and not CANCELLED
    useEffect(() => {
        if (booking && booking.status !== 'PENDING' && booking.status !== 'CANCELLED') {
            router.push(`/booking/payment-result?error=Đơn hàng đã hết hạn hoặc không hợp lệ.`);
        }
    }, [booking, bookingCode, router]);

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
            <div className="container mx-auto py-8 px-4 space-y-6">
                <Skeleton className="h-10 w-24 mb-4" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                </div>
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



    if (booking && booking.status === 'CANCELLED') {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Đơn hàng đã bị hủy</CardTitle>
                    </CardHeader>
                    <CardContent className="py-4 text-center text-muted-foreground">
                        <p>Bạn đã hủy đơn hàng này. Vui lòng quay lại trang chủ để đặt vé mới.</p>
                        <Button className="mt-4" onClick={() => router.push('/')}>
                            Về trang chủ
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (booking && booking.status !== 'PENDING') {
        return (
            <div className="container mx-auto py-24 space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    const trip = booking.trip;
    const fromStationId = booking.metadata?.fromStationId;
    const toStationId = booking.metadata?.toStationId;

    console.log('Trip Route Stations:', trip.route.stations);
    console.log('From:', fromStationId, 'To:', toStationId);

    const fromStation = (trip.route.stations || []).find((rs: any) => rs.stationId === fromStationId);
    const toStation = (trip.route.stations || []).find((rs: any) => rs.stationId === toStationId);

    const departureDate = trip.departureTime && fromStation && fromStation.durationFromStart !== undefined
        ? addMinutes(new Date(trip.departureTime), fromStation.durationFromStart)
        : new Date(trip.departureTime);

    // Calculate arrival date (placeholder logic, adjust as needed)
    const arrivalDate = trip.departureTime && toStation && toStation.durationFromStart !== undefined
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
                onSuccess: (data: any) => {
                    setPaymentDialog({
                        open: true,
                        amount: data.totalPrice,
                        paymentUrl: data.paymentUrl,
                        bookingCode: data.bookingCode
                    });
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
                submitLabel={isUpdating ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang xử lý…
                    </div>
                ) : "Thanh toán"}
                bookingCode={bookingCode || undefined}
                bookingExpiresAt={booking.expiresAt}
            />

            <PaymentMethodDialog
                open={paymentDialog.open}
                onOpenChange={(open) => setPaymentDialog(prev => ({ ...prev, open }))}
                amount={paymentDialog.amount}
                paymentUrl={paymentDialog.paymentUrl}
                bookingCode={bookingCode || ""}
            />
        </div>
    );
}

export default function PassengersPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto py-8 px-4 space-y-6">
                <Skeleton className="h-10 w-24 mb-4" />
                <Skeleton className="h-48 w-full mb-6" />
                <Skeleton className="h-96 w-full" />
            </div>
        }>
            <PassengersPageContent />
        </Suspense>
    );
}
