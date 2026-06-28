"use client";

import { format } from "date-fns";
import { Train, Tag, Users, Calendar, Clock, MapPin, ArrowRight, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Booking } from "@/features/booking/hooks/use-my-bookings";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BookingTimer } from "./booking-timer";
import Link from "next/link";
import { getActualDepartureTime } from "@/lib/utils/trip-time";

interface BookingHistoryCardProps {
    booking: Booking;
}

export function BookingHistoryCard({ booking }: BookingHistoryCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Socket logic moved to useMyBookings hook

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PENDING': return {
                bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500',
                dot: 'bg-amber-500'
            };
            case 'PAID': return {
                bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500',
                dot: 'bg-emerald-500'
            };
            case 'CANCELLED': return {
                bg: 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400',
                dot: 'bg-gray-500'
            };
            case 'PAYMENT_FAILED': return {
                bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-500',
                dot: 'bg-rose-500'
            };
            default: return {
                bg: 'bg-gray-50 dark:bg-zinc-800 text-muted-foreground',
                dot: 'bg-muted-foreground'
            };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'CANCELLED': return 'Đã hủy';
            case 'PAYMENT_FAILED': return 'Thanh toán lỗi';
            default: return status;
        }
    };


    const metadata = booking.metadata;
    const passengerCount = booking.tickets?.length || metadata?.passengers?.length || metadata?.seatIds?.length || 0;
    const actualDepartureTime = getActualDepartureTime(booking.trip);

    const borderClass = booking.status === 'PAID' ? 'border-l-green-500'
        : booking.status === 'PENDING' ? 'border-l-yellow-500'
            : booking.status === 'PAYMENT_FAILED' ? 'border-l-red-500'
                : 'border-l-destructive';

    return (
        <div 
            className="group relative bg-white dark:bg-zinc-900 rounded-[1.25rem] p-4 shadow-xl shadow-rose-900/[0.03] dark:shadow-none border border-gray-100 dark:border-zinc-800 transition-all overflow-hidden"
        >
            <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Header Row: Code & Status */}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <Badge variant="outline" className="font-mono text-[10px] h-6 px-3 bg-gray-50/50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-700 text-muted-foreground/70 rounded-full">
                        {booking.code}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                        {booking.status === 'PENDING' && (
                            <div className="scale-90 origin-right opacity-90">
                                <BookingTimer expiresAt={booking.expiresAt} onExpire={() => {
                                    queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
                                    router.refresh();
                                }} />
                            </div>
                        )}
                        {(() => {
                            const styles = getStatusStyles(booking.status);
                            return (
                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full border-none shadow-sm",
                                    styles.bg
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", styles.dot)} />
                                    <span className={cn("text-[10px] font-bold leading-none")}>
                                        {getStatusLabel(booking.status)}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Content Row: Icon, Route, Train */}
                <div className="flex items-center gap-3 mb-6 px-1">
                    <div className="w-10 h-10 rounded-[0.85rem] bg-[#802222] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Train className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-tight mb-0.5 truncate">
                            {booking.trip.route.name}
                        </h3>
                        <p className="text-xs font-bold text-muted-foreground/80 leading-none">
                            Tàu {booking.trip.train.code}
                        </p>
                    </div>
                </div>

                <Separator className="bg-gray-50 dark:bg-zinc-800/50 mb-4" />

                <div className="flex flex-wrap justify-between items-start sm:items-end gap-3 mb-4">
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-medium text-muted-foreground opacity-70 leading-none">Khởi hành</p>
                            <span className="text-base font-semibold text-[#802222] dark:text-rose-400 tabular-nums leading-none mt-1">
                                {format(actualDepartureTime, "HH:mm")}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground mt-1 leading-none">{format(actualDepartureTime, "dd/MM/yyyy")}</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-medium text-muted-foreground opacity-70 leading-none">Hành khách</p>
                            <span className="text-base font-semibold text-[#802222] dark:text-rose-400 leading-none mt-1">
                                {passengerCount}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground mt-1 leading-none">người</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] font-medium text-muted-foreground opacity-70 leading-none mb-1">Tổng chi phí</p>
                        <div className="text-lg font-bold text-[#802222] tracking-tight leading-none">
                            {booking.totalPrice === 0
                                ? <span className="text-[10px] font-normal italic opacity-40">Chưa định giá</span>
                                : formatCurrency(booking.totalPrice)
                            }
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="default"
                        className="flex-1 bg-[#802222] hover:bg-rose-900 text-white font-medium text-xs rounded-full h-9 border-none shadow-md"
                        asChild
                    >
                        <Link href={`/dashboard/history/${booking.code}`}>Chi tiết chuyến</Link>
                    </Button>
                    
                    {booking.status === 'PENDING' && (
                        <Button
                            asChild
                            className="flex-1 bg-[#802222] hover:bg-rose-900 text-white font-medium text-xs rounded-full h-9 shadow-lg shadow-rose-900/20"
                        >
                            <Link href={`/dashboard/booking/passengers?bookingCode=${booking.code}`}>
                                Thanh toán ngay <ArrowRight className="ml-1.5 h-3 w-3" />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Decorative background gradient glow circles */}
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-rose-500/22 to-pink-500/0 dark:from-[#802222]/38 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-gradient-to-tr from-rose-500/18 to-pink-500/0 dark:from-[#802222]/22 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
        </div>
    );
}
