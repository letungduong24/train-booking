'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, addMinutes } from 'date-fns';
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

    const activeParams = searchParams;

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-[#802222] dark:text-rose-400 mb-2">Đặt vé tàu</h1>
                <p className="text-muted-foreground text-sm font-medium opacity-80">Tìm kiếm chuyến tàu phù hợp với hành trình của bạn</p>
            </div>

            <div className="grid grid-cols-12 gap-6 items-stretch">
                {/* Left Column - Vertical Search Form */}
                <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-6 z-20 flex flex-col">
                    <TripSearchForm
                        layout="vertical"
                        className="h-full"
                        defaultValues={{
                            fromStationId: initialFrom,
                            toStationId: initialTo,
                            date: initialDate
                        }}
                        onSubmit={onSubmit}
                    />
                </div>

                {/* Right Column - Results / Empty State */}
                <div className="col-span-12 lg:col-span-8 flex flex-col">
                    {activeParams ? (
                        <div className="space-y-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kết quả tìm kiếm</h2>
                                <div className="h-0.5 flex-1 bg-gray-100 dark:bg-zinc-800 mx-6 hidden md:block opacity-50" />
                            </div>

                            {isSearching ? (
                                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-20 text-center border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.01] flex-1 flex flex-col justify-center items-center">
                                    <Spinner className="h-10 w-10 mx-auto mb-4 text-[#802222]" />
                                    <p className="text-sm font-medium text-muted-foreground">Đang tìm kiếm chuyến tàu...</p>
                                </div>
                            ) : trips && trips.length > 0 ? (
                                <>
                                    {/* Check if the first trip matches the search date */}
                                    {format(new Date(trips[0].departureTime), 'yyyy-MM-dd') !== activeParams.date && (
                                        <div className="mb-6 bg-amber-50/80 dark:bg-amber-950/20 backdrop-blur-md p-6 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center text-amber-600 shadow-sm">
                                                <CalendarIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                                    Không tìm thấy chuyến tàu vào ngày {format(new Date(activeParams.date), 'dd/MM/yyyy')}.
                                                </p>
                                                <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70 mt-0.5">
                                                    Dưới đây là các chuyến tàu gần nhất mà bạn có thể tham khảo:
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-6">
                                        {trips.map((trip: any) => {
                                            const fromStation = trip.resolvedFrom;
                                            const toStation = trip.resolvedTo;
                                            
                                            // Calculate actual departure/arrival for this specific segment if details exist
                                            const departureTime = trip.departureTime && fromStation
                                                ? addMinutes(new Date(trip.departureTime), fromStation.durationFromStart)
                                                : new Date(trip.departureTime);

                                            return (
                                                <div 
                                                    key={trip.id} 
                                                    className="group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-gray-100/70 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.01] hover:shadow-2xl hover:shadow-rose-900/[0.04] dark:shadow-none overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300"
                                                    onClick={() => router.push(`/dashboard/booking/${trip.id}?from=${activeParams.fromStationId}&to=${activeParams.toStationId}`)}
                                                >
                                                    <div className="flex flex-col xl:flex-row items-stretch min-h-[110px]">
                                                        {/* Left Train Icon Decor */}
                                                        <div className="bg-[#802222]/5 dark:bg-[#802222]/10 p-6 xl:p-8 flex items-center justify-center group-hover:bg-[#802222] group-hover:text-white transition-all duration-500 border-b xl:border-b-0 xl:border-r border-gray-100 dark:border-zinc-800">
                                                            <Train className="h-8 w-8 text-[#802222] dark:text-rose-400 group-hover:text-white transition-colors duration-500" />
                                                        </div>

                                                        {/* Content Body */}
                                                        <div className="flex-1 p-6 xl:p-8 flex flex-col xl:flex-row items-center justify-between gap-6 xl:gap-8 z-10 relative">
                                                            {/* Route info */}
                                                            <div className="text-center xl:text-left flex-1 min-w-0 xl:max-w-[200px] w-full">
                                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#802222] dark:group-hover:text-rose-400 transition-colors leading-tight truncate">{trip.route.name}</h3>
                                                                <div className="flex items-center justify-center xl:justify-start gap-2">
                                                                    <span className="text-xs font-semibold text-muted-foreground px-2.5 py-1 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800/80">Số hiệu {trip.train.code}</span>
                                                                </div>
                                                            </div>

                                                            {/* Mid Segment Timeline */}
                                                            <div className="flex items-center gap-3 text-center xl:mx-4 shrink-0 w-full xl:w-auto justify-center">
                                                                <div className="text-right flex-1 xl:flex-none">
                                                                    <span className="text-[10px] font-bold text-muted-foreground/60 block mb-0.5 uppercase tracking-wider">Ga đi</span>
                                                                    <span className="text-sm font-bold text-gray-800 dark:text-zinc-200 block truncate xl:max-w-[120px]" title={fromStation?.station?.name}>{fromStation?.station?.name || 'Ga đi'}</span>
                                                                </div>
                                                                <div className="flex flex-col items-center flex-1 xl:flex-none min-w-[60px] xl:min-w-[80px]">
                                                                    <span className="text-[9px] font-bold text-[#802222] dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full scale-90 mb-1">Hành trình</span>
                                                                    <div className="w-full h-0.5 bg-rose-100 dark:bg-rose-950/50 relative my-0.5">
                                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#802222] dark:bg-rose-400 shadow-[0_0_6px_rgba(128,34,34,0.4)]" />
                                                                    </div>
                                                                </div>
                                                                <div className="text-left flex-1 xl:flex-none">
                                                                    <span className="text-[10px] font-bold text-muted-foreground/60 block mb-0.5 uppercase tracking-wider">Ga đến</span>
                                                                    <span className="text-sm font-bold text-gray-800 dark:text-zinc-200 block truncate xl:max-w-[120px]" title={toStation?.station?.name}>{toStation?.station?.name || 'Ga đến'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Right column: Departure & CTA Button stacked vertically to optimize desktop horizontal space */}
                                                            <div className="flex flex-row xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-4 w-full xl:w-auto border-t xl:border-t-0 pt-4 xl:pt-0 border-gray-100 dark:border-zinc-800/80 shrink-0">
                                                                <div className="flex flex-col items-start xl:items-end">
                                                                    <p className="text-[10px] font-bold text-muted-foreground/60 mb-0.5 uppercase tracking-wider">Khởi hành</p>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-2xl font-black text-[#802222] dark:text-rose-400 tabular-nums leading-none">
                                                                            {format(departureTime, 'HH:mm')}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-muted-foreground/80 ml-1">{format(departureTime, 'dd/MM/yyyy')}</span>
                                                                    </div>
                                                                </div>

                                                                <Button className="h-10 rounded-xl px-5 bg-[#802222] hover:bg-rose-900 text-xs font-bold shadow-lg shadow-rose-950/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 outline-none border-none whitespace-nowrap">
                                                                    Chọn chuyến
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Decorative background gradient glow circles */}
                                                    <div className="absolute -right-16 -top-16 w-36 h-36 bg-gradient-to-br from-rose-500/10 to-pink-500/0 dark:from-[#802222]/15 dark:to-transparent rounded-full blur-2xl z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                    <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-gradient-to-tr from-rose-500/8 to-pink-500/0 dark:from-[#802222]/10 dark:to-transparent rounded-full blur-2xl z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl rounded-[2rem] p-24 text-center border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.01] flex-1 flex flex-col justify-center items-center">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-6 text-[#802222] dark:text-rose-400">
                                        <Search className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Không tìm thấy chuyến</h3>
                                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium text-sm opacity-80 leading-relaxed">
                                        Rất tiếc, hiện không có chuyến tàu nào phù hợp với yêu cầu của bạn. Vui lòng thử lại với thông tin khác.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Welcome State (Empty State) */
                        <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] p-12 md:p-16 text-center border border-gray-100/70 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.01] overflow-hidden group flex-1 flex flex-col justify-center items-center">
                            <div className="absolute -right-24 -top-24 w-72 h-72 bg-gradient-to-br from-rose-500/10 to-pink-500/0 dark:from-[#802222]/15 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
                            <div className="absolute -left-24 -bottom-24 w-72 h-72 bg-gradient-to-tr from-rose-500/8 to-pink-500/0 dark:from-[#802222]/10 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
                                <div className="w-20 h-20 rounded-[2.2rem] bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-[#802222] dark:text-rose-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md shadow-rose-900/5">
                                    <Train className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">Lựa chọn hành trình của bạn</h3>
                                <p className="text-muted-foreground text-sm font-medium opacity-80 leading-relaxed mb-8">
                                    Nhập ga đi, ga đến và ngày khởi hành ở bảng tìm kiếm để tìm các chuyến tàu phù hợp nhất với hành trình của bạn.
                                </p>
                                <div className="grid grid-cols-3 gap-4 w-full text-left">
                                    <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-100/50 dark:border-zinc-800/50">
                                        <div className="text-[#802222] dark:text-rose-400 text-xs font-extrabold mb-1">01</div>
                                        <div className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">Chọn chặng đi</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-100/50 dark:border-zinc-800/50">
                                        <div className="text-[#802222] dark:text-rose-400 text-xs font-extrabold mb-1">02</div>
                                        <div className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">Chọn ghế ngồi</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-100/50 dark:border-zinc-800/50">
                                        <div className="text-[#802222] dark:text-rose-400 text-xs font-extrabold mb-1">03</div>
                                        <div className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">Thanh toán</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
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
