"use client";

import { format } from "date-fns";
import { Train, Tag, Users, Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Booking } from "@/features/booking/hooks/use-my-bookings";
import { useRouter } from "next/navigation";

interface BookingHistoryCardProps {
    booking: Booking;
}

export function BookingHistoryCard({ booking }: BookingHistoryCardProps) {
    const router = useRouter();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'PAID': return 'bg-green-500 hover:bg-green-600';
            case 'CANCELLED': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-gray-500';
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

    const handlePay = () => {
        router.push(`/onboard/booking/passengers?bookingCode=${booking.code}`);
    };

    const handleViewDetails = () => {
        router.push(`/onboard/history/${booking.code}`);
    };

    const metadata = (booking as any).metadata;
    const passengerCount = booking.tickets?.length || metadata?.passengers?.length || metadata?.seatIds?.length || 0;

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-4"
            style={{ borderLeftColor: booking.status === 'PAID' ? '#22c55e' : booking.status === 'PENDING' ? '#eab308' : '#ef4444' }}>
            <CardHeader className="bg-muted/30 pb-3">
                <div className="flex justify-between items-start flex-">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded text-primary">
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
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} border-none text-white shadow-sm`}>
                        {getStatusLabel(booking.status)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground mb-0.5">Khởi hành</span>
                            <div className="flex items-center gap-1.5 font-semibold text-sm">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {format(new Date(booking.trip.departureTime), "dd/MM/yyyy")}
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold text-lg">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                {format(new Date(booking.trip.departureTime), "HH:mm")}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground mb-0.5">Tổng tiền</span>
                        <span className="text-xl font-bold text-primary">
                            {booking.totalPrice === 0 && booking.status === 'PENDING'
                                ? <span className="text-sm font-normal italic text-muted-foreground">Chưa định giá</span>
                                : `${booking.totalPrice.toLocaleString("vi-VN")} ₫`
                            }
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/20 p-2 rounded-md">
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{passengerCount} hành khách</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Vé tàu</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between gap-3 pt-2 pb-4">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleViewDetails}
                >
                    Chi tiết
                </Button>
                {booking.status === 'PENDING' && (
                    <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={handlePay}
                    >
                        Thanh toán ngay <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
