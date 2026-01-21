'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { formatCurrency } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface Booking {
    id: string;
    code: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    totalPrice: number;
    createdAt: string;
    tripId: string;
    trip: {
        departureTime: string;
        endTime: string;
        route: {
            name: string;
        };
        train: {
            code: string;
            name: string;
        };
    };
    tickets: any[];
}

export default function HistoryPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            console.log('Fetching my bookings...');
            const res = await apiClient.get('/bookings/my-bookings');
            console.log('Bookings received:', res.data);
            setBookings(res.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Không thể tải lịch sử đặt vé');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (booking: Booking) => {
        switch (booking.status) {
            case 'PAID':
                return <Badge className="bg-green-500 hover:bg-green-600">Đã thanh toán</Badge>;
            case 'PENDING':
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">Chờ thanh toán</Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6"
                            onClick={() => router.push(`/onboard/booking/passengers?bookingCode=${booking.code}`)}
                        >
                            Tiếp tục
                        </Button>
                    </div>
                );
            case 'CANCELLED':
                return <Badge variant="destructive">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{booking.status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <h1 className="text-2xl font-bold mb-6">Lịch sử đặt vé</h1>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã vé</TableHead>
                            <TableHead>Chuyến tàu</TableHead>
                            <TableHead>Tuyến</TableHead>
                            <TableHead>Ngày đi</TableHead>
                            <TableHead>Tổng tiền</TableHead>
                            <TableHead>Trạng thái</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Bạn chưa có lịch sử đặt vé nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-medium">{booking.code}</TableCell>
                                    <TableCell>{booking.trip.train.code}</TableCell>
                                    <TableCell>{booking.trip.route.name}</TableCell>
                                    <TableCell>
                                        {dayjs(booking.trip.departureTime).format('HH:mm DD/MM/YYYY')}
                                    </TableCell>
                                    <TableCell>
                                        {booking.totalPrice === 0 && booking.status === 'PENDING'
                                            ? <span className="text-muted-foreground italic">Chờ định giá</span>
                                            : formatCurrency(booking.totalPrice)
                                        }
                                    </TableCell>
                                    <TableCell>{getStatusBadge(booking)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
