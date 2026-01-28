'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Train } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type TripSearchInput } from '@/lib/schemas/booking.schema';
import { useSearchTrips } from '@/features/booking/hooks/use-search-trips';
import { TripSearchForm } from '@/features/home/components/trip-search-form';
import { timeSync } from '@/lib/time-sync';

export default function BookingPage() {
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

                            {trips.map((trip: any) => (
                                <Card key={trip.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => router.push(`/booking/${trip.id}?from=${searchParams.fromStationId}&to=${searchParams.toStationId}`)}>
                                    <CardContent className="px-6">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary/10 rounded-lg">
                                                    <Train className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{trip.route.name}</h3>
                                                    <p className="text-sm text-muted-foreground">Tàu {trip.train.code}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-end gap-1 md:gap-0">
                                                <p className="text-muted-foreground">Khởi hành<span className="inline-block md:hidden">:</span></p>
                                                <span className="font-semibold">{format(new Date(trip.departureTime), 'HH:mm')} - {format(new Date(trip.departureTime), 'dd/MM/yyyy')}</span>
                                            </div>
                                            <Button className="w-full md:w-auto">Chọn chuyến</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                Không tìm thấy chuyến tàu phù hợp. Vui lòng thử lại với thông tin khác.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
