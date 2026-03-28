'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useBooking } from '@/features/booking/hooks/use-booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Calendar, Clock, MapPin, Train, CreditCard, User, Ticket, Wifi, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import dayjs from 'dayjs';
import { RouteMap } from '@/features/routes/components/route-map';
import { BookingTimer } from '@/features/booking/components/booking-timer';
import { CancelBookingButton } from '@/features/booking/components/cancel-booking-button';
// import { socket } from '@/lib/socket';
import { useEffect } from 'react';

export default function BookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const code = params.code as string;

    // Socket logic moved to useBooking hook

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
                <Button onClick={() => router.back()}>Quay lại</Button>
            </div>
        );
    }

    const { trip, tickets, status, totalPrice, metadata } = booking;
    const departureDate = new Date(trip.departureTime);

    const stations = trip.route.stations || [];
    let fromStation = stations.find((s: any) => s.stationId === metadata?.fromStationId);
    let toStation = stations.find((s: any) => s.stationId === metadata?.toStationId);

    // Fallback for PAID bookings where metadata might be cleared/irrelevant if tickets exist
    if (!fromStation && tickets.length > 0) {
        fromStation = stations.find((s: any) => s.index === tickets[0].fromStationIndex);
    }
    if (!toStation && tickets.length > 0) {
        toStation = stations.find((s: any) => s.index === tickets[0].toStationIndex);
    }

    // Calculate departure and arrival times with delays
    const scheduledDeparture = dayjs(trip.departureTime).add(fromStation?.durationFromStart || 0, 'minute');
    const actualDeparture = scheduledDeparture.add(trip.departureDelayMinutes || 0, 'minute');
    const departureDelay = trip.departureDelayMinutes || 0;

    const scheduledArrival = dayjs(trip.departureTime).add(toStation?.durationFromStart || 0, 'minute');
    const actualArrival = scheduledArrival.add(trip.arrivalDelayMinutes || 0, 'minute');
    const arrivalDelay = trip.arrivalDelayMinutes || 0;

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

    return (
        <div className="container mx-auto">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
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
                <div className="lg:col-span-2 space-y-8">
                    {/* Premium Trip Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-zinc-800 relative overflow-hidden group">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-[#802222] dark:text-rose-400">
                                    <Train className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium text-muted-foreground mb-1">Mã đơn: {booking.code}</p>
                                    <h2 className="text-xl font-bold text-[#802222] dark:text-rose-400">Tàu {trip.train.code}</h2>
                                </div>
                            </div>
                            
                            {trip.status === 'IN_PROGRESS' ? (
                                <Badge className="bg-[#e6f7ef] hover:bg-[#e6f7ef] text-[#00a651] border-none px-3 py-1.5 rounded-full font-medium text-[11px] flex gap-2 items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a651] animate-pulse" />
                                    Đang chạy
                                </Badge>
                            ) : (
                                <Badge className={`${getStatusClasses(status)} border-none px-3 py-1.5 rounded-full font-medium text-[11px]`}>
                                    {getStatusLabel(status)}
                                </Badge>
                            )}
                        </div>

                        {/* Timing Section */}
                        <div className="flex justify-between items-center mb-8 px-1">
                            <div className="flex flex-col gap-1.5">
                                <p className="text-[11px] font-medium text-muted-foreground leading-none">{fromStation?.station?.name || '---'}</p>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold text-[#802222] dark:text-rose-400 tabular-nums">
                                        {actualDeparture.format('HH:mm')}
                                    </span>
                                    {departureDelay > 0 && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-muted-foreground/30 line-through">{scheduledDeparture.format('HH:mm')}</span>
                                            <span className="text-[9px] text-red-500/80 font-bold">+{departureDelay}m</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center px-6">
                                <div className="w-full h-[1px] bg-gray-100 dark:bg-zinc-800 relative flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 z-10" />
                                    <ArrowRight className="absolute -right-1 h-3 w-3 text-gray-300" />
                                </div>
                                <p className="text-[10px] font-medium text-muted-foreground/60 mt-3">
                                    {trip.status === 'IN_PROGRESS' ? 'Đang Vận Hành' : 'Lộ Trình'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-1.5 text-right">
                                <p className="text-[11px] font-medium text-muted-foreground leading-none">{toStation?.station?.name || '---'}</p>
                                <span className="text-2xl font-bold text-[#802222] dark:text-rose-400 tabular-nums">
                                    {actualArrival.format('HH:mm')}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <Separator className="bg-gray-50 dark:bg-zinc-800/50 mb-6" />
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                    <Wifi className="h-4 w-4 opacity-50" />
                                    <span>Wifi Free</span>
                                </div>
                                <div className="w-[1px] h-3 bg-gray-200" />
                                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                    <Calendar className="h-4 w-4 opacity-50" />
                                    <span>{actualDeparture.format('DD / MM / YYYY')}</span>
                                </div>
                            </div>
                            
                            <Button variant="secondary" className="bg-rose-50 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#802222] dark:text-rose-400 font-medium text-xs px-8 rounded-full h-10 border-none shadow-sm transition-all hover:scale-105 active:scale-95">
                                Chi tiết vé
                            </Button>
                        </div>

                        {/* Decorative background element */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-50/30 dark:bg-rose-950/5 rounded-full blur-3xl -z-10 group-hover:bg-rose-100/40 transition-colors" />
                    </div>

                    {/* Map Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-zinc-800 overflow-hidden group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-[#802222] dark:text-rose-400">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-[#802222] dark:text-rose-400">
                                Bản đồ lộ trình
                            </h3>
                        </div>
                        <div className="rounded-[1.5rem] overflow-hidden border border-gray-50 dark:border-zinc-800 h-[300px]">
                            <RouteMap
                                stations={stations}
                                className="h-full"
                                highlightSegment={{
                                    fromStationId: fromStation?.stationId || '',
                                    toStationId: toStation?.stationId || ''
                                }}
                                pathCoordinates={trip.route.pathCoordinates}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Tickets */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-xl shadow-gray-100 border border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-[#802222] dark:text-rose-400">
                                <Ticket className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-[#802222] dark:text-rose-400">
                                Danh sách vé ({tickets.length > 0 ? tickets.length : metadata?.passengers?.length || 0})
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {tickets.length > 0 ? (
                                // Hiển thị tickets đã tạo (PAID)
                                tickets.map((ticket: any, index: number) => (
                                    <div key={ticket.id} className="group relative flex flex-col gap-4 p-5 rounded-[2rem] border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-lg hover:shadow-gray-100 transition-all duration-300">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-[#802222] text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-rose-900/20 group-hover:scale-110 transition-transform">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{ticket.passengerName}</p>
                                                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        {ticket.passengerId || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-white border-none shadow-sm rounded-lg px-3 py-1 font-semibold text-xs text-[#802222]">
                                                Ghế {ticket.seat?.coach ? `${ticket.seat.coach.name}-${ticket.seat.name}` : ticket.seat?.name || '---'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-200">
                                            <p className="text-[11px] font-medium text-muted-foreground/60">Giá vé</p>
                                            <span className="text-lg font-bold text-[#802222]">{formatCurrency(ticket.price)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : metadata?.passengers ? (
                                // Hiển thị passengers từ metadata (PAYMENT_FAILED, PENDING)
                                metadata.passengers.map((passenger: any, index: number) => {
                                    const seat = metadata.seats?.find((s: any) => s.id === passenger.seatId);
                                    return (
                                        <div key={passenger.seatId} className="group relative flex flex-col gap-4 p-5 rounded-[2rem] border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-lg hover:shadow-gray-100 transition-all duration-300">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-zinc-400 text-white flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{passenger.passengerName}</p>
                                                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                                            {passenger.passengerId || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-white border-none shadow-sm rounded-lg px-3 py-1 font-semibold text-xs text-zinc-500">
                                                    Ghế {seat?.name || '---'}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-200">
                                                <p className="text-[11px] font-medium text-muted-foreground/60">Giá vé</p>
                                                <span className="text-lg font-bold text-zinc-600">{formatCurrency(passenger.price || seat?.price || 0)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-10 opacity-50">Không có thông tin vé</p>
                            )}
                        </div>
                    </div>

                    {/* Payment Card */}
                    <div className="bg-[#802222] rounded-[2rem] p-6 shadow-2xl shadow-rose-900/20 text-white relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <p className="text-[11px] font-medium opacity-80 mb-1">Tổng cộng thanh toán</p>
                            <CreditCard className="h-4 w-4 opacity-40" />
                        </div>
                        
                        <div className="mb-8 relative z-10">
                            {totalPrice === 0 ? (
                                <span className="text-base font-normal italic opacity-60">Chưa định giá</span>
                            ) : (
                                <span className="text-3xl font-bold tracking-tight">{formatCurrency(totalPrice)}</span>
                            )}
                        </div>

                        {status === 'PENDING' ? (
                            <div className="space-y-4">
                                <Button
                                    className="w-full bg-white hover:bg-white/90 text-[#802222] font-semibold h-12 text-sm rounded-full shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => router.push(`/dashboard/booking/passengers?bookingCode=${booking.code}`)}
                                >
                                    Thanh toán ngay
                                </Button>
                                <CancelBookingButton
                                    bookingCode={code}
                                    className="w-full bg-rose-900/30 hover:bg-rose-900/50 text-rose-200 border-none rounded-full h-11 text-xs font-medium"
                                    onCancelSuccess={() => router.refresh()}
                                >
                                    Hủy đơn hàng
                                </CancelBookingButton>
                                <p className="text-[11px] text-center text-rose-200 opacity-60 font-medium mt-2">
                                    Vui lòng thanh toán trước khi vé hết hạn.
                                </p>
                            </div>
                        ) : status === 'PAID' ? (
                            <div className="bg-white/10 rounded-3xl p-4 text-center border border-white/10">
                                <p className="text-sm font-medium">Đã thanh toán thành công</p>
                            </div>
                        ) : status === 'PAYMENT_FAILED' ? (
                            <div className="bg-red-500/20 rounded-3xl p-5 border border-red-500/30">
                                <p className="text-sm font-semibold mb-2">Thanh toán thất bại</p>
                                <p className="text-xs opacity-80 leading-relaxed font-medium">Ghế đã được đặt hoặc lỗi hệ thống. Tiền đã được hoàn về ví.</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
