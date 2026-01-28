'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMyBookings } from '@/features/booking/hooks/use-my-bookings';
import { BookingHistoryCard } from '@/features/booking/components/booking-history-card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string>('PAID');

    const debouncedSearch = useDebounce(search, 500);

    // Sync tab with URL on mount
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['PAID', 'PENDING', 'CANCELLED'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const { data, isLoading } = useMyBookings({
        page,
        limit: 9,
        search: debouncedSearch,
        status: activeTab,
    });

    const bookings = data?.data || [];
    const meta = data?.meta;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setPage(1);
        router.push(`/dashboard/history?tab=${value}`);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lịch sử đặt vé</h1>
                    <p className="text-muted-foreground mt-1">Quản lý và theo dõi các chuyến đi của bạn</p>
                </div>

                <div className="relative w-full md:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo mã vé, tên tàu..."
                        className="pl-9"
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="PAID">Thành công</TabsTrigger>
                    <TabsTrigger value="PENDING">Chờ thanh toán</TabsTrigger>
                    <TabsTrigger value="CANCELLED">Đã hủy</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-24">
                            <div className="flex flex-col items-center gap-2">
                                <Spinner className="h-8 w-8" />
                                <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/10">
                            <div className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3">
                                <Search className="h-12 w-12" />
                            </div>
                            <h3 className="text-lg font-medium">Không tìm thấy đơn hàng nào</h3>
                            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                                {search ? 'Thử thay đổi từ khóa tìm kiếm của bạn.' : 'Bạn chưa có đơn hàng nào trong danh mục này.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {bookings.map((booking) => (
                                    <BookingHistoryCard key={booking.id} booking={booking} />
                                ))}
                            </div>

                            {meta && meta.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                                    </Button>
                                    <div className="flex items-center gap-1 mx-2">
                                        <span className="text-sm font-medium">Trang {meta.page} / {meta.totalPages}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= meta.totalPages}
                                    >
                                        Sau <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
