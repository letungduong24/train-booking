'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Train, Wifi, ArrowRight, MapPin, Calendar, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type TripSearchInput } from '@/lib/schemas/booking.schema';
import { useSearchTrips } from '@/features/booking/hooks/use-search-trips';
import { TripSearchForm } from '@/features/home/components/trip-search-form';
import { timeSync } from '@/lib/time-sync';
import { useAuth } from '@/hooks/use-auth';

function BookingPageContent() {
    const router = useRouter();
    const urlSearchParams = useSearchParams();
    const { user } = useAuth();

    // Get initial values from URL params
    const initialFrom = urlSearchParams.get('from') || '';
    const initialTo = urlSearchParams.get('to') || '';
    const initialDate = urlSearchParams.get('date') || format(timeSync.now(), 'yyyy-MM-dd');

    // Initialize state with URL params if they exist
    const [searchParams, setSearchParams] = useState<TripSearchInput | null>(
        (urlSearchParams.get('from') && urlSearchParams.get('to'))
            ? {
                fromStationId: initialFrom,
                toStationId: initialTo,
                date: initialDate
            }
            : null
    );

    // Sync state with URL params when they change (handle browser back/forward)
    useEffect(() => {
        const from = urlSearchParams.get('from');
        const to = urlSearchParams.get('to');
        const date = urlSearchParams.get('date');

        if (from && to && date) {
            setSearchParams({
                fromStationId: from,
                toStationId: to,
                date: date
            });
        }
    }, [urlSearchParams]);

    const { data: trips, isLoading: isSearching } = useSearchTrips(
        searchParams || { fromStationId: '', toStationId: '', date: '' },
        !!searchParams
    );

    const onSubmit = (values: TripSearchInput) => {
        setSearchParams(values);

        // Update URL to reflect search
        const params = new URLSearchParams();
        params.append('from', values.fromStationId);
        params.append('to', values.toStationId);
        params.append('date', values.date);

        router.push(`/booking?${params.toString()}`);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Đặt vé tàu</h1>
                <p className="text-muted-foreground">Tìm kiếm chuyến tàu phù hợp với hành trình của bạn</p>
            </div>

            <div className="mb-8 w-full">
                <TripSearchForm
                    defaultValues={{
                        fromStationId: initialFrom,
                        toStationId: initialTo,
                        date: initialDate
                    }}
                    onSubmit={onSubmit}
                />
            </div>

            {/* Search Results */}
            {searchParams && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Kết quả tìm kiếm</h2>
                    {isSearching ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                Đang tìm kiếm chuyến tàu...
                            </CardContent>
                        </Card>
                    ) : trips && trips.length > 0 ? (
                        <>
                            {/* Check if the first trip matches the search date */}
                            {format(new Date(trips[0].departureTime), 'yyyy-MM-dd') !== searchParams.date && (
                                <div className="mb-4 text-muted-foreground">
                                    <p>
                                        Không tìm thấy chuyến tàu phù hợp vào ngày {format(new Date(searchParams.date), 'dd/MM/yyyy')}.
                                    </p>
                                    <p className="mt-1">
                                        Dưới đây là các chuyến tàu gần nhất mà bạn có thể tham khảo:
                                    </p>
                                </div>
                            )}

                            {trips.map((trip: any) => {
                                const departureDate = new Date(trip.departureTime);
                                return (
                                    <div 
                                        key={trip.id} 
                                        className="group relative bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-xl shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-zinc-800 transition-all hover:shadow-2xl hover:shadow-rose-900/10 cursor-pointer overflow-hidden mb-5"
                                        onClick={() => {
                                            const prefix = user ? '/dashboard' : '';
                                            router.push(`${prefix}/booking/${trip.id}?from=${searchParams.fromStationId}&to=${searchParams.toStationId}`);
                                        }}
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-stretch gap-6 relative z-10">
                                            {/* Train Info */}
                                            <div className="flex items-center gap-4 md:w-1/4">
                                                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-[#802222] dark:text-rose-400 shrink-0">
                                                    <Train className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-0.5">Mã tàu</p>
                                                    <h3 className="text-xl font-black text-[#802222] dark:text-rose-400 tracking-tight leading-none uppercase">{trip.train.code}</h3>
                                                </div>
                                            </div>

                                            {/* Timing & Route */}
                                            <div className="flex-1 flex items-center justify-between px-2">
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 leading-none">Khởi hành</p>
                                                    <span className="text-2xl font-black text-[#802222] dark:text-rose-400 tabular-nums">
                                                        {format(departureDate, 'HH:mm')}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{format(departureDate, 'dd/MM/yyyy')}</span>
                                                </div>

                                                <div className="flex-1 flex flex-col items-center justify-center px-8">
                                                    <div className="w-full h-[2px] bg-gray-100 dark:bg-zinc-800 relative flex items-center justify-center">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                                                        <div className="w-2 h-2 rounded-full bg-primary z-10 shadow-[0_0_8px_rgba(var(--primary),0.3)]" />
                                                        <ArrowRight className="absolute -right-1 h-3 w-3 text-gray-300" />
                                                    </div>
                                                    <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mt-5 truncate max-w-[150px]">
                                                        {trip.route.name}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col text-right">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 leading-none">Lộ trình</p>
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5 text-[#802222] dark:text-rose-400 mb-0.5">
                                                            <MapPin className="h-3.5 w-3.5 opacity-40" />
                                                            <span className="text-base font-black uppercase tracking-tighter">Ga đi</span>
                                                        </div>
                                                        <p className="text-[9px] font-bold text-muted-foreground/60 max-w-[100px] truncate leading-none">
                                                            {trip.route.name.split('-')[0].trim()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="md:w-1/5 flex flex-col justify-center items-end border-l border-dashed border-gray-100 pl-6">
                                                <div className="flex items-center gap-2 mb-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-gray-50 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                                                    <Wifi className="h-3 w-3 opacity-50" />
                                                    <span>WIFI FREE</span>
                                                </div>
                                                <Button className="w-full bg-[#802222] hover:bg-[#902222] text-white font-black h-10 rounded-full uppercase tracking-widest text-[9px] shadow-lg shadow-rose-900/20 transition-all hover:scale-105 active:scale-95 border-none">
                                                    CHỌN VÉ
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Decorative background element */}
                                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-50/30 dark:bg-rose-950/5 rounded-full blur-3xl -z-0 group-hover:bg-rose-100/40 transition-colors" />
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                Không tìm thấy chuyến tàu phù hợp. Vui lòng thử lại với thông tin khác.
                            </CardContent>
                        </Card>
                    )
                    }
                </div>
            )}
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="container mx-auto py-8 px-4 text-center">Đang tải cấu hình...</div>}>
            <BookingPageContent />
        </Suspense>
    );
}
