'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useBooking } from '@/features/booking/hooks/use-booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Calendar, Clock, MapPin, Train, CreditCard, User, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import dayjs from 'dayjs';
import { RouteMap } from '@/features/routes/components/route-map';
import { BookingTimer } from '@/features/booking/components/booking-timer';
import { CancelBookingButton } from '@/features/booking/components/cancel-booking-button';
import { socket } from '@/lib/socket';
import { useEffect } from 'react';

export default function BookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const code = params.code as string;

    useEffect(() => {
        if (!code) return;

        function onConnect() {
            console.log("Connected to booking namespace");
        }

        function onStatusUpdate(data: { bookingCode: string; status: string }) {
            if (data.bookingCode === code) {
                queryClient.invalidateQueries({ queryKey: ['booking', code] });
                router.refresh();
            }
        }

        socket.connect();
        socket.on("connect", onConnect);
        socket.on("booking.status_update", onStatusUpdate);

        return () => {
            socket.off("connect", onConnect);
            socket.off("booking.status_update", onStatusUpdate);
        };
    }, [code, router, queryClient]);

    const { data: booking, isLoading, error } = useBooking(code);

    if (isLoading) {
        return (
            <div className="container mx-auto py-20 flex justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn hàng</h2>
                <Button onClick={() => router.push('/onboard/history')}>Quay lại danh sách</Button>
            </div>
        );
    }

    const { trip, tickets, status, totalPrice, metadata } = booking;
    const departureDate = new Date(trip.departureTime);

    let fromStation = trip.route.stations.find((s: any) => s.stationId === metadata?.fromStationId);
    let toStation = trip.route.stations.find((s: any) => s.stationId === metadata?.toStationId);

    // Fallback for PAID bookings where metadata might be cleared/irrelevant if tickets exist
    if (!fromStation && tickets.length > 0) {
        fromStation = trip.route.stations.find((s: any) => s.index === tickets[0].fromStationIndex);
    }
    if (!toStation && tickets.length > 0) {
        toStation = trip.route.stations.find((s: any) => s.index === tickets[0].toStationIndex);
    }

    // Calculate arrival date based on duration (if available in route stations... simplified here)
    // For now we just show departure.

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
            case 'PAID': return 'bg-green-500 hover:bg-green-600 text-white';
            case 'CANCELLED': return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <Button variant="ghost" onClick={() => router.push('/onboard/history')} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại lịch sử
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Chi tiết vé tàu</h1>
                    <p className="text-muted-foreground mt-1">Mã đơn hàng: <span className="font-mono font-bold text-foreground">{booking.code}</span></p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge className={`${getStatusClasses(status)} px-4 py-1.5 text-sm`}>
                        {getStatusLabel(status)}
                    </Badge>
                    {status === 'PENDING' && (
                        <div className="text-lg">
                            <BookingTimer expiresAt={booking.expiresAt} onExpire={() => router.refresh()} />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Trip Info & Route Map */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-muted/30 p-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Train className="h-5 w-5 text-primary" />
                                Thông tin chuyến đi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tàu</p>
                                    <p className="font-bold text-lg">{trip.train.code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Tuyến</p>
                                    <p className="font-medium">{trip.route.name}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ga đi</p>
                                    <p className="font-semibold">{fromStation?.station?.name || '---'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Ga đến</p>
                                    <p className="font-semibold">{toStation?.station?.name || '---'}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Calendar className="h-4 w-4" /> Ngày đi
                                    </div>
                                    <p className="font-semibold">{format(departureDate, 'dd/MM/yyyy')}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Clock className="h-4 w-4" /> Giờ khởi hành
                                    </div>
                                    <p className="font-semibold">{format(departureDate, 'HH:mm')}</p>
                                </div>
                            </div>

                            {trip.route.stations && (
                                <div className="pt-4">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Bản đồ lộ trình
                                    </h4>
                                    <div className="rounded-md border overflow-hidden">
                                        <RouteMap stations={trip.route.stations} className="h-[300px]" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Tickets & Payment */}
                <div className="space-y-6">
                    {/* Tickets */}
                    <Card>
                        <CardHeader className="bg-muted/30 p-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-primary" />
                                Danh sách vé ({tickets.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="">
                            <div className="space-y-4">
                                {tickets.map((ticket: any, index: number) => (
                                    <div key={ticket.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border bg-card/50 gap-3">
                                        <div className="flex gap-3">
                                            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold">{ticket.passengerName}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" /> {ticket.passengerId || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                                            <Badge variant="outline" className="mb-0 sm:mb-1">
                                                Ghế {ticket.seat?.name || '---'}
                                            </Badge>
                                            <span className="font-semibold">{formatCurrency(ticket.price)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardHeader className="bg-muted/30 p-4">
                            <CardTitle className="text-lg">Thanh toán</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Tổng cộng</span>
                                <span className="font-bold text-xl text-primary">
                                    {totalPrice === 0
                                        ? <span className="text-sm font-normal italic text-muted-foreground">Chưa định giá</span>
                                        : formatCurrency(totalPrice)
                                    }
                                </span>
                            </div>

                            {status === 'PENDING' ? (
                                <div className="pt-4">
                                    <div className="flex flex-col gap-2">
                                        <CancelBookingButton
                                            bookingCode={code}
                                            className="w-full"
                                            onCancelSuccess={() => router.refresh()}
                                        >
                                            Hủy đơn hàng
                                        </CancelBookingButton>
                                        <Button
                                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold h-12 text-md"
                                            onClick={() => router.push(`/onboard/booking/passengers?bookingCode=${code}`)}
                                        >
                                            Thanh toán ngay
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Vui lòng thanh toán trước khi vé hết hạn giữ chỗ.
                                    </p>
                                </div>
                            ) : status === 'PAID' ? (
                                <div className="pt-4">
                                    <Button variant="outline" className="w-full" disabled>
                                        Đã thanh toán thành công
                                    </Button>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
