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
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#802222] dark:text-rose-400 mb-1 tracking-tight">Lịch sử đặt vé</h1>
                    <p className="text-muted-foreground text-base font-medium opacity-80">Quản lý và theo dõi các chuyến đi của bạn</p>
                </div>

                <div className="relative w-full md:w-[320px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#802222] transition-colors" />
                    <Input
                        placeholder="Tìm theo mã vé, tên tàu..."
                        className="pl-11 pr-4 h-12 rounded-2xl border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:ring-2 focus:ring-[#802222]/10 transition-all font-medium"
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-gray-100/50 dark:bg-zinc-800/50 p-1 text-muted-foreground mb-6 border border-gray-100 dark:border-zinc-800">
                    <TabsTrigger 
                        value="PAID" 
                        className="rounded-xl px-6 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all"
                    >
                        Thành công
                    </TabsTrigger>
                    <TabsTrigger 
                        value="PENDING" 
                        className="rounded-xl px-6 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all"
                    >
                        Chờ thanh toán
                    </TabsTrigger>
                    <TabsTrigger 
                        value="CANCELLED" 
                        className="rounded-xl px-6 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all"
                    >
                        Đã hủy
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-gray-100/50 dark:shadow-none">
                            <div className="w-24 h-24 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mb-6 text-[#802222] opacity-20">
                                <Search className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Không tìm thấy đơn hàng</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium text-center opacity-60">
                                {search ? 'Thử thay đổi từ khóa tìm kiếm của bạn.' : 'Bạn hiện chưa có đơn hàng nào trong danh mục này.'}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => { setSearch(''); setActiveTab('PAID'); }}
                                className="mt-8 rounded-2xl px-8 font-medium text-sm"
                            >
                                Quay lại trang đầu
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {bookings.map((booking) => (
                                    <BookingHistoryCard key={booking.id} booking={booking} />
                                ))}
                            </div>

                            {meta && meta.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-12 bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-lg shadow-gray-100/50 dark:shadow-none w-fit mx-auto">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-[#802222]"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    
                                    <div className="px-6 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            Trang <span className="text-[#802222] font-semibold">{meta.page}</span> / {meta.totalPages}
                                        </span>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-[#802222]"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= meta.totalPages}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div >
    );
}
