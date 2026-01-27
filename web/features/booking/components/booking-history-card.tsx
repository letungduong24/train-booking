"use client";

import { format } from "date-fns";
import { Train, Tag, Users, Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { Booking } from "@/features/booking/hooks/use-my-bookings";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BookingTimer } from "./booking-timer";
import { CancelBookingButton } from "./cancel-booking-button";
import { socket } from "@/lib/socket";

interface BookingHistoryCardProps {
    booking: Booking;
}

export function BookingHistoryCard({ booking }: BookingHistoryCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (booking.status !== 'PENDING') return;

        function onConnect() {
            console.log("Connected to booking namespace");
        }

        function onStatusUpdate(data: { bookingCode: string; status: string }) {
            if (data.bookingCode === booking.code) {
                queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
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
    }, [booking.code, booking.status, router, queryClient]);

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
            case 'PAID': return 'bg-green-500 hover:bg-green-600 text-white';
            case 'CANCELLED': return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
            case 'PAYMENT_FAILED': return 'bg-red-500 hover:bg-red-600 text-white';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'CANCELLED': return 'Đã hủy';
            case 'PAYMENT_FAILED': return 'Thanh toán thất bại';
            default: return status;
        }
    };

    const handlePay = () => {
        router.push(`/booking/passengers?bookingCode=${booking.code}`);
    };

    const handleViewDetails = () => {
        router.push(`/dashboard/history/${booking.code}`);
    };

    const metadata = booking.metadata;
    const passengerCount = booking.tickets?.length || metadata?.passengers?.length || metadata?.seatIds?.length || 0;

    const borderClass = booking.status === 'PAID' ? 'border-l-green-500'
        : booking.status === 'PENDING' ? 'border-l-yellow-500'
            : booking.status === 'PAYMENT_FAILED' ? 'border-l-red-500'
                : 'border-l-destructive';

    return (
        <Card className={cn("hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-4 justify-between", borderClass)}>
            <CardHeader className="bg-muted/30">
                <div className="space-y-1 py-2">
                    <div className="flex items-center gap-2 py-">
                        <div className="bg-primary/10 rounded text-primary">
                            <Train className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-lg">{booking.trip.train.code}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                            {booking.code}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 pl-1">
                        {booking.trip.route.name}
                    </p>
                    <div className="flex items-center justify-between">
                        <Badge className={`${getStatusClasses(booking.status)} border-none shadow-sm`}>
                            {getStatusLabel(booking.status)}
                        </Badge>
                        {booking.status === 'PENDING' && (
                            <BookingTimer expiresAt={booking.expiresAt} onExpire={() => {
                                queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
                                router.refresh();
                            }} />
                        )}
                    </div>
                </div>


            </CardHeader>
            <CardContent className="grid gap-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground mb-0.5">Khởi hành</span>
                            <div className="flex items-center gap-1.5 font-semibold">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {format(new Date(booking.trip.departureTime), "dd/MM/yyyy")}
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {format(new Date(booking.trip.departureTime), "HH:mm")}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground mb-0.5">Tổng tiền</span>
                        <span className="text-xl font-bold text-primary">
                            {booking.totalPrice === 0
                                ? <span className="text-sm font-normal italic text-muted-foreground">Chưa định giá</span>
                                : `${booking.totalPrice.toLocaleString("vi-VN")} ₫`
                            }
                        </span>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>{passengerCount} hành khách</span>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="grid gap-3 items-end">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleViewDetails}
                >
                    Chi tiết
                </Button>
                {booking.status === 'PENDING' && (
                    <div className="flex w-full gap-2">
                        <CancelBookingButton
                            bookingCode={booking.code}
                            className="flex-1"
                            onCancelSuccess={() => {
                                queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
                                router.refresh();
                            }}
                        />
                        <Button
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                            onClick={handlePay}
                        >
                            Thanh toán <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
