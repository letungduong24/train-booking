'use client';

import { useMyActiveTrips, type Booking } from '@/features/booking/hooks/use-my-bookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    IconTrain, 
    IconChevronRight, 
    IconFilter, 
    IconWifi,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function TripsPage() {
    const router = useRouter();
    const { data: activeBookings = [], isLoading } = useMyActiveTrips();

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-primary mb-1">
                        Chuyến đi đang chạy
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-2xl">
                        Các hành trình bạn đang thực hiện. Theo dõi lộ trình và trạng thái trực tiếp của đoàn tàu.
                    </p>
                </div>
                <Button variant="outline" className="rounded-full px-5 h-10 font-medium text-xs">
                    <IconFilter className="mr-2 size-4 opacity-40" />
                    Lọc hành trình
                </Button>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-[300px] w-full rounded-3xl" />
                        ))}
                    </div>
                ) : activeBookings.length === 0 ? (
                    <Card className="rounded-[2.5rem] border-dashed border-2 bg-muted/20 border-muted">
                        <CardContent className="flex flex-col items-center justify-center py-24">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <IconTrain className="size-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-medium text-muted-foreground mb-1">Không có chuyến đi đang chạy</h3>
                            <p className="text-sm text-muted-foreground/60 max-w-xs text-center">
                                Hiện tại bạn không có hành trình nào đang diễn ra. Hãy kiểm tra lịch trình sắp tới hoặc đặt vé mới.
                            </p>
                            <Button 
                                className="mt-6 rounded-full px-7 h-11 bg-[#802222] hover:bg-rose-900 text-white font-medium"
                                onClick={() => router.push('/dashboard/booking')}
                            >
                                Đặt vé ngay
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {activeBookings.map((booking) => {
                            const { trip } = booking;
                            const departure = new Date(trip.departureTime);
                            const arrival = new Date(trip.endTime);
                            const now = new Date();
                            
                            // Calculate progress
                            const total = arrival.getTime() - departure.getTime();
                            const current = now.getTime() - departure.getTime();
                            const progress = Math.min(Math.max((current / total) * 100, 0), 100);

                            return (
                                <Card key={booking.id} className="group relative overflow-hidden rounded-[1.25rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/5 transition-all hover:scale-[1.01] bg-white dark:bg-zinc-900">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-5 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#802222] flex items-center justify-center text-white shadow-sm shrink-0">
                                                    <IconTrain className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium text-muted-foreground opacity-60 mb-0.5">Mã đơn: {booking.code}</p>
                                                    <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400 leading-none">Tàu {trip.train?.code}</h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                                <span className="text-[10px] font-medium">Đang chạy</span>
                                            </div>
                                        </div>
     
                                        <div className="relative flex justify-between items-center mb-6 px-1 z-10">
                                            <div className="text-left w-2/5">
                                                <p className="text-[10px] font-medium text-muted-foreground mb-0.5 truncate opacity-60">
                                                    {trip.route?.name.split(' - ')[0]}
                                                </p>
                                                <p className="text-xl font-bold text-[#802222] dark:text-rose-400 leading-none tabular-nums">{format(departure, 'HH:mm')}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground mt-1 opacity-60 tabular-nums">{format(departure, 'dd/MM/yyyy')}</p>
                                            </div>
     
                                            <div className="flex-1 flex flex-col items-center px-4 relative">
                                                <div className="w-full h-1 bg-gray-100 dark:bg-zinc-800 rounded-full relative overflow-hidden shadow-inner">
                                                    <div 
                                                        className="absolute top-0 left-0 h-full bg-[#802222] opacity-20 transition-all duration-1000"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                    <div 
                                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-[#802222]/20 rounded-full shadow-md flex items-center justify-center transition-all duration-1000 z-10"
                                                        style={{ left: `calc(${progress}% - 8px)` }}
                                                    >
                                                        <IconChevronRight className="size-2.5 text-[#802222]" />
                                                    </div>
                                                </div>
                                            </div>
     
                                            <div className="text-right w-2/5">
                                                <p className="text-[10px] font-medium text-muted-foreground mb-0.5 truncate opacity-60">
                                                    {trip.route?.name.split(' - ')[1]}
                                                </p>
                                                <p className="text-xl font-bold text-[#802222] dark:text-rose-400 leading-none tabular-nums">{format(arrival, 'HH:mm')}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground mt-1 opacity-60 tabular-nums">{format(arrival, 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
    
                                        <div className="pt-5 border-t border-gray-50 dark:border-zinc-800 relative z-10">
                                            <Button 
                                                className="w-full rounded-full h-10 bg-[#802222] hover:bg-rose-900 text-white transition-all duration-300 font-medium text-xs shadow-md"
                                                onClick={() => router.push(`/dashboard/history/${booking.code}`)}
                                            >
                                                Chi tiết vé
                                            </Button>
                                        </div>

                                        {/* Decorative backgrounds */}
                                        <div className="absolute -right-16 -top-16 w-40 h-40 bg-rose-100/30 dark:bg-rose-950/10 rounded-full blur-3xl z-0" />
                                        <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-rose-100/20 dark:bg-rose-950/5 rounded-full blur-3xl z-0" />
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
