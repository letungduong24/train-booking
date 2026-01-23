'use client';

import { useState } from 'react';
import { useMyBookings } from '@/features/booking/hooks/use-my-bookings';
import { BookingHistoryCard } from '@/features/booking/components/booking-history-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function HistoryPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('ALL');

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useMyBookings({
        page,
        limit: 9, // Grid layout, 9 usually fits better
        search: debouncedSearch,
        status,
    });

    const bookings = data?.data || [];
    const meta = data?.meta;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lịch sử đặt vé</h1>
                    <p className="text-muted-foreground mt-1">Quản lý và theo dõi các chuyến đi của bạn</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo mã vé..."
                            className="pl-9"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                            <SelectItem value="PAID">Đã thanh toán</SelectItem>
                            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

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
                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.
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
        </div>
    );
}
