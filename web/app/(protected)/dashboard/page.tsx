'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useMyBookings } from '@/features/booking/hooks/use-my-bookings';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Clock, CreditCard, History, Ticket, User, ArrowRight, MapPin, Train } from 'lucide-react';
import Link from 'next/link';

import { timeSync } from '@/lib/time-sync';
import { useMemo } from 'react';
import { DashboardTripCard } from './components/dashboard-trip-card';
import { DashboardActivityItem } from './components/dashboard-activity-item';

export default function OnboardPage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    // Fetch recent bookings (limit 10 should be enough to find an upcoming one usually)
    const { data, isLoading } = useMyBookings({
        page: 1,
        limit: 10,
        status: 'ALL',
    });

    // Check for pending bookings
    const { data: pendingData } = useMyBookings({
        page: 1,
        limit: 1,
        status: 'PENDING',
    });

    const pendingCount = pendingData?.meta?.total || 0;

    const bookings = data?.data || [];

    // ... (rest of filtering logic)

    // Get all in-progress trips: Status is PAID and trip status is IN_PROGRESS
    // Sort by departure time ascending, limit to 5 trips
    const inProgressTrips = useMemo(() => {
        return bookings
            .filter(b =>
                b.status === 'PAID' &&
                b.trip.status === 'IN_PROGRESS'
            )
            .sort((a, b) => new Date(a.trip.departureTime).getTime() - new Date(b.trip.departureTime).getTime())
            .slice(0, 3);
    }, [bookings]);

    // Get all upcoming trips: Status is PAID and departure time is in future (Pending filtered out)
    // Sort by departure time ascending, limit to 5 trips
    const upcomingTrips = useMemo(() => {
        const now = timeSync.now();
        return bookings
            .filter(b =>
                b.status === 'PAID' &&
                new Date(b.trip.departureTime) > now
            )
            .sort((a, b) => new Date(a.trip.departureTime).getTime() - new Date(b.trip.departureTime).getTime())
            .slice(0, 3);
    }, [bookings]);

    if (isLoading && !user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-8">
            {/* Pending Payment Alert */}
            {pendingCount > 0 && (
                <Link
                    href="/dashboard/history?tab=PENDING"
                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-full text-yellow-700 dark:text-yellow-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-500">Thanh toán đang chờ xử lý</h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-600">
                                Bạn có <span className="font-bold">{pendingCount} đơn hàng</span> cần thanh toán.
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                </Link>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Xin chào, {user?.name || 'Bạn'}!</h1>
                    <p className="text-muted-foreground mt-1">
                        Chào mừng trở lại với Railflow. Chúc bạn một ngày tốt lành.
                    </p>
                </div>
                <Button asChild className="bg-primary shadow-lg hover:shadow-xl transition-all">
                    <Link href="/booking">
                        <Ticket className="mr-2 h-4 w-4" /> Đặt vé mới
                    </Link>
                </Button>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* In-Progress Trips Section */}
                <Card className="shadow-sm overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Train className="h-5 w-5 text-green-600" />
                                Chuyến đang chạy
                            </CardTitle>

                        </div>
                        <CardDescription>
                            Các chuyến tàu của bạn đang trên đường đi
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {inProgressTrips.length > 0 ? (
                            <div className="space-y-4">
                                {inProgressTrips.map((booking) => (
                                    <DashboardTripCard key={booking.id} booking={booking} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <div className="bg-background p-3 rounded-full mb-3 mx-auto w-fit">
                                    <Train className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="font-medium">Không có chuyến nào đang chạy</p>
                                <p className="text-sm mt-1">Các chuyến tàu của bạn sẽ hiển thị ở đây khi đang di chuyển</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Trips Section */}
                <Card className="shadow-sm overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Chuyến đi sắp tới
                            </CardTitle>

                        </div>
                        <CardDescription>
                            Hãy chuẩn bị sẵn sàng cho các hành trình sắp tới
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingTrips.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingTrips.map((booking) => (
                                    <DashboardTripCard key={booking.id} booking={booking} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <div className="bg-background p-3 rounded-full mb-3 mx-auto w-fit">
                                    <Ticket className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="font-medium">Chưa có chuyến đi nào sắp tới</p>
                                <p className="text-sm mt-1">Hãy tìm kiếm và đặt vé ngay hôm nay!</p>
                                <Button variant="secondary" size="sm" className="mt-3" asChild>
                                    <Link href="/">Tìm chuyến đi</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>



            <div className="grid grid-cols-1 gap-6">
                {/* Recent Activity Section */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" />
                                Hoạt động gần đây
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs" asChild>
                                <Link href="/dashboard/history">
                                    Xem tất cả <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {bookings.length > 0 ? (
                            <div className="space-y-3">
                                {bookings.slice(0, 5).map((booking) => (
                                    <DashboardActivityItem key={booking.id} booking={booking} />
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
