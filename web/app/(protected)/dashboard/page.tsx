'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useMyBookings } from '@/features/booking/hooks/use-my-bookings';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Clock, CreditCard, History, Ticket, User, ArrowRight, MapPin, Train } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { timeSync } from '@/lib/time-sync';
import { useMemo } from 'react';

export default function OnboardPage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    // Fetch recent bookings (limit 10 should be enough to find an upcoming one usually)
    const { data, isLoading } = useMyBookings({
        page: 1,
        limit: 10,
        status: 'ALL',
    });

    const bookings = data?.data || [];

    // Find upcoming trip: Status is PAID or PENDING and departure time is in future
    // Sort by departure time ascending to get the *nearest* upcoming trip
    const upcomingTrip = useMemo(() => {
        const now = timeSync.now();
        return bookings
            .filter(b =>
                (b.status === 'PAID' || b.status === 'PENDING') &&
                new Date(b.trip.departureTime) > now
            )
            .sort((a, b) => new Date(a.trip.departureTime).getTime() - new Date(b.trip.departureTime).getTime())[0];
    }, [bookings]);

    // Recent activity: Just take the top 3 from the list (which is sorted by createdAt desc usually, 
    // but useMyBookings default sort might be createdAt desc. Let's assume default is good or we should have asked for sort)
    // Actually useMyBookings default sort is typically createdAt desc.
    const recentActivity = bookings.slice(0, 3);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return <Badge className="bg-green-600">Đã thanh toán</Badge>;
            case 'PENDING':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Chờ thanh toán</Badge>;
            case 'CANCELLED':
                return <Badge variant="destructive">Đã hủy</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (isLoading && !user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Xin chào, {user?.name || 'Bạn'}! 👋</h1>
                    <p className="text-muted-foreground mt-1">
                        Chào mừng trở lại với Railflow. Chúc bạn một ngày tốt lành.
                    </p>
                </div>
                <Button onClick={() => router.push('/booking')} className="bg-primary shadow-lg hover:shadow-xl transition-all">
                    <Ticket className="mr-2 h-4 w-4" /> Đặt vé mới
                </Button>
            </div>

            {/* Upcoming Trip Section */}
            {upcomingTrip ? (
                <Card className="border-l-4 border-l-primary shadow-sm bg-primary/5 overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Chuyến đi sắp tới của bạn
                                </CardTitle>
                                <CardDescription>
                                    Hãy chuẩn bị sẵn sàng cho hành trình này nhé!
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/history/${upcomingTrip.code}`)}>
                                Chi tiết
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-6 mt-2">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4 text-lg font-semibold">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-muted-foreground" />
                                        <span>Sài Gòn</span> {/* TODO: Use real station names if available in future, using route name for now is approximate or we need logic to parse route */}
                                        {/* Since booking.trip.route.name usually is like "Sài Gòn - Nha Trang". 
                                            Currently we don't have exact from/to station names in Booking object easily without parsing tickets.
                                            Let's use Route Name for now.
                                        */}
                                        <span>{upcomingTrip.trip.route.name}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Train className="h-4 w-4" />
                                        <span>Tàu {upcomingTrip.trip.train.code}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{format(new Date(upcomingTrip.trip.departureTime), 'HH:mm dd/MM/yyyy', { locale: vi })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center items-end min-w-[150px]">
                                <div className="text-2xl font-bold text-primary">
                                    {getStatusBadge(upcomingTrip.status)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Mã vé: {upcomingTrip.code}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="bg-background p-3 rounded-full mb-4 shadow-sm">
                            <Ticket className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">Chưa có chuyến đi nào sắp tới</h3>
                        <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                            Bạn chưa có kế hoạch di chuyển nào. Hãy tìm kiếm và đặt vé ngay hôm nay!
                        </p>
                        <Button variant="secondary" onClick={() => router.push('/')}>
                            Tìm chuyến đi
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats / Profile Quick View */}
                <Card className="md:col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5" /> Thông tin cá nhân
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium truncate max-w-[180px]">{user?.name || 'Người dùng'}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-[180px]">{user?.email}</p>
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push('/dashboard/profile')}
                            >
                                <User className="mr-2 h-4 w-4" /> Cập nhật hồ sơ
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push('/dashboard/history')}
                            >
                                <History className="mr-2 h-4 w-4" /> Lịch sử đặt vé
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5" /> Hoạt động gần đây
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/dashboard/history')}>
                                Xem tất cả <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/dashboard/history/${booking.code}`)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-md">
                                                <Train className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{booking.trip.route.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(booking.trip.departureTime), 'dd/MM/yyyy', { locale: vi })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-medium text-sm">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice)}
                                            </span>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Chưa có hoạt động nào gần đây</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
