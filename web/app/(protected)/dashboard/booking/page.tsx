'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Spinner } from '@/components/ui/spinner';
import { Train, CalendarIcon, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type TripSearchInput } from '@/lib/schemas/booking.schema';
import { useSearchTrips } from '@/features/booking/hooks/use-search-trips';
import { TripSearchForm } from '@/features/home/components/trip-search-form';
import { timeSync } from '@/lib/time-sync';

function BookingPageContent() {
    const router = useRouter();
    const urlSearchParams = useSearchParams();

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

        router.push(`/dashboard/booking?${params.toString()}`);
    };

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#802222] dark:text-rose-400 mb-2">Đặt vé tàu</h1>
                <p className="text-muted-foreground text-base font-medium opacity-80">Tìm kiếm chuyến tàu phù hợp với hành trình của bạn</p>
            </div>

            <div className="mb-12 w-full">
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
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kết quả tìm kiếm</h2>
                        <div className="h-0.5 flex-1 bg-gray-100 dark:bg-zinc-800 mx-6 hidden md:block opacity-50" />
                    </div>

                    {isSearching ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-20 text-center border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-gray-100/50 dark:shadow-none">
                            <Spinner className="h-10 w-10 mx-auto mb-4 text-[#802222]" />
                            <p className="text-sm font-medium text-muted-foreground">Đang tìm kiếm chuyến tàu...</p>
                        </div>
                    ) : trips && trips.length > 0 ? (
                        <>
                            {/* Check if the first trip matches the search date */}
                            {format(new Date(trips[0].departureTime), 'yyyy-MM-dd') !== searchParams.date && (
                                <div className="mb-6 bg-amber-50 dark:bg-amber-950/20 p-6 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center text-amber-600 shadow-sm">
                                        <CalendarIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                            Không tìm thấy chuyến tàu vào ngày {format(new Date(searchParams.date), 'dd/MM/yyyy')}.
                                        </p>
                                        <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70 mt-0.5">
                                            Dưới đây là các chuyến tàu gần nhất mà bạn có thể tham khảo:
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                {trips.map((trip: any) => (
                                    <div 
                                        key={trip.id} 
                                        className="group relative bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-gray-100/50 dark:shadow-none overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-rose-900/5 hover:-translate-y-1 transition-all duration-300"
                                        onClick={() => router.push(`/dashboard/booking/${trip.id}?from=${searchParams.fromStationId}&to=${searchParams.toStationId}`)}
                                    >
                                        <div className="flex flex-col md:flex-row items-stretch">
                                            <div className="bg-[#802222]/5 p-8 flex items-center justify-center group-hover:bg-[#802222] group-hover:text-white transition-all duration-500 border-r border-gray-50 dark:border-zinc-800">
                                                <Train className="h-10 w-10 text-[#802222] group-hover:text-white transition-colors duration-500" />
                                            </div>
                                            <div className="flex-1 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                                <div className="text-center md:text-left">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#802222] transition-colors">{trip.route.name}</h3>
                                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                                        <span className="text-xs font-medium text-muted-foreground px-3 py-1 bg-gray-50 dark:bg-zinc-800 rounded-lg">Số hiệu {trip.train.code}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center md:items-end">
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Khởi hành</p>
                                                    <span className="text-2xl font-bold text-[#802222] dark:text-rose-400 tabular-nums leading-none mb-1">
                                                        {format(new Date(trip.departureTime), 'HH:mm')}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground">{format(new Date(trip.departureTime), 'dd/MM/yyyy')}</span>
                                                </div>
                                                <Button className="h-12 rounded-2xl px-8 bg-[#802222] hover:bg-rose-900 text-sm font-medium shadow-xl shadow-rose-950/20 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none border-none">
                                                    Chọn chuyến
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {/* Decorative element */}
                                        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-rose-50 dark:bg-rose-950/10 rounded-full blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-24 text-center border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-gray-100/50 dark:shadow-none">
                            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-6 text-[#802222] opacity-20">
                                <Search className="h-10 w-10" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Không tìm thấy chuyến</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium opacity-60">
                                Rất tiếc, hiện không có chuyến tàu nào phù hợp với yêu cầu của bạn. Vui lòng thử lại với thông tin khác.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

import { Suspense } from 'react';

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-8 md:p-8 lg:p-10">
                <div className="px-4 lg:px-6 text-center text-muted-foreground">
                    Đang tải cấu hình...
                </div>
            </div>
        }>
            <BookingPageContent />
        </Suspense>
    );
}
