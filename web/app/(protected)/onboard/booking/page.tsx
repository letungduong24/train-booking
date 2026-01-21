'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon, Search, Train } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { tripSearchSchema, type TripSearchInput } from '@/lib/schemas/booking.schema';
import { useStations } from '@/features/stations/hooks/use-stations';
import { useSearchTrips } from '@/features/booking/hooks/use-search-trips';

export default function BookingPage() {
    const router = useRouter();
    const [searchParams, setSearchParams] = useState<TripSearchInput | null>(null);

    const { data: stationsData } = useStations({ page: 1, limit: 100 });
    const stations = stationsData?.data || [];

    const form = useForm<TripSearchInput>({
        resolver: zodResolver(tripSearchSchema),
        defaultValues: {
            fromStationId: '',
            toStationId: '',
            date: format(new Date(), 'yyyy-MM-dd'),
        },
    });

    const { data: trips, isLoading: isSearching } = useSearchTrips(
        searchParams || { fromStationId: '', toStationId: '', date: '' },
        !!searchParams
    );

    const onSubmit = (values: TripSearchInput) => {
        setSearchParams(values);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Đặt vé tàu</h1>
                <p className="text-muted-foreground">Tìm kiếm chuyến tàu phù hợp với hành trình của bạn</p>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Tìm kiếm chuyến tàu</CardTitle>
                    <CardDescription>Nhập thông tin hành trình để tìm chuyến tàu</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fromStationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ga đi</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn ga đi" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {stations.map((station) => (
                                                        <SelectItem key={station.id} value={station.id}>
                                                            {station.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="toStationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ga đến</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn ga đến" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {stations.map((station) => (
                                                        <SelectItem key={station.id} value={station.id}>
                                                            {station.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Ngày đi</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                'w-full pl-3 text-left font-normal',
                                                                !field.value && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>Chọn ngày</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" className="w-full md:w-auto" disabled={isSearching}>
                                <Search className="mr-2 h-4 w-4" />
                                {isSearching ? 'Đang tìm kiếm...' : 'Tìm chuyến tàu'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

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
                        trips.map((trip: any) => (
                            <Card key={trip.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/onboard/booking/${trip.id}?from=${searchParams.fromStationId}&to=${searchParams.toStationId}`)}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-lg">
                                                <Train className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{trip.route.name}</h3>
                                                <p className="text-sm text-muted-foreground">Tàu {trip.train.code}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Khởi hành</p>
                                            <p className="font-semibold">{format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')}</p>
                                        </div>
                                        <Button>Chọn chuyến</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
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
