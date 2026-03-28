'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Clock, CreditCard, History, Ticket, ArrowRight, Train, Wallet, Map, Heart } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { DashboardTripCard, DashboardTransactionItem } from '@/features/dashboard/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    const { data: overview, isLoading } = useDashboardOverview();

    if (isLoading && !user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    const stats = overview?.stats;
    const pendingCount = stats?.pendingCount || 0;
    const activeCount = stats?.activeCount || 0;
    const upcomingTrips = overview?.upcomingTrips || [];
    const pendingBookings = overview?.pendingBookings || [];
    const recentTransactions = overview?.recentTransactions || [];
    const activeTrips = overview?.activeTrips || [];

    const currencyFormatter = new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    });

    return (
        <div className="flex flex-1 flex-col gap-8 pb-10">
            {/* Section 1: Welcome Banner */}
            <section className="">
                <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#802222] to-rose-900 shadow-xl flex items-center p-8 text-white group border border-rose-800/20">
                    <div className="z-10 max-w-2xl relative">
                        <p className="text-xs font-medium mb-1.5 opacity-80">Xin chào trở lại</p>
                        <h1 className="text-2xl font-bold mb-4 leading-tight tracking-tight">
                            Chúc {user?.name?.split(' ')[0] || 'bạn'} một ngày <br/>
                            hành trình <span className="text-rose-200">tuyệt vời!</span>
                        </h1>
                        <div className="flex flex-wrap gap-4">
                            <Button 
                                asChild 
                                className="bg-white text-[#802222] hover:bg-rose-50 font-bold text-sm h-12 px-8 rounded-2xl transition-all shadow-lg shadow-rose-950/20 hover:scale-[1.03] active:scale-95 border-none"
                            >
                                <Link href="/dashboard/booking" className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4" />
                                    Đặt vé ngay
                                </Link>
                            </Button>
                            
                            <Button 
                                variant="outline"
                                asChild 
                                className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold text-sm h-12 px-6 rounded-2xl transition-all backdrop-blur-md hover:scale-[1.03] active:scale-95"
                            >
                                <Link href="/dashboard/wallet" className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Ví tiền
                                </Link>
                            </Button>

                            <Button 
                                variant="outline"
                                asChild 
                                className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold text-sm h-12 px-6 rounded-2xl transition-all backdrop-blur-md hover:scale-[1.03] active:scale-95"
                            >
                                <Link href="/dashboard/history" className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Lịch sử
                                </Link>
                            </Button>
                        </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute right-0 top-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-12 -z-0" />
                    <Train className="absolute -right-20 -bottom-10 w-96 h-96 opacity-[0.03] -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                </div>
            </section>

            {/* Section 2: Key Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-[1.25rem] p-5 shadow-xl shadow-rose-900/5 transition-all hover:scale-[1.01] border border-gray-100 dark:border-zinc-800 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 transition-colors group-hover:bg-[#802222] group-hover:text-white shrink-0">
                            <Train className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground opacity-40 uppercase tracking-widest">Status</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-0.5 leading-none tracking-tight tabular-nums relative z-10">{String(activeCount).padStart(2, '0')}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium relative z-10">Chuyến đang chạy</p>
                    
                    {/* Decorative backgrounds */}
                    <div className="absolute -right-16 -top-16 w-40 h-40 bg-rose-100/30 dark:bg-rose-950/10 rounded-full blur-3xl z-0" />
                    <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-rose-100/20 dark:bg-rose-950/5 rounded-full blur-3xl z-0" />
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[1.25rem] p-5 shadow-xl shadow-rose-900/5 transition-all hover:scale-[1.01] border border-gray-100 dark:border-zinc-800 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 transition-colors group-hover:bg-[#802222] group-hover:text-white shrink-0">
                            <Calendar className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground opacity-40 uppercase tracking-widest">Upcoming</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-0.5 leading-none tracking-tight tabular-nums relative z-10">{String(upcomingTrips.length).padStart(2, '0')}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium relative z-10">Chuyến sắp tới</p>

                    {/* Decorative backgrounds */}
                    <div className="absolute -right-16 -top-16 w-40 h-40 bg-rose-100/30 dark:bg-rose-950/10 rounded-full blur-3xl z-0" />
                    <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-rose-100/20 dark:bg-rose-950/5 rounded-full blur-3xl z-0" />
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[1.25rem] p-5 shadow-xl shadow-rose-900/5 transition-all hover:scale-[1.01] border border-gray-100 dark:border-zinc-800 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 transition-colors group-hover:bg-[#802222] group-hover:text-white shrink-0">
                            <Clock className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground opacity-40 uppercase tracking-widest">Pending</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-0.5 leading-none tracking-tight tabular-nums text-[#802222] relative z-10">{String(pendingCount).padStart(2, '0')}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium relative z-10">Chờ thanh toán</p>

                    {/* Decorative backgrounds */}
                    <div className="absolute -right-16 -top-16 w-40 h-40 bg-rose-100/30 dark:bg-rose-950/10 rounded-full blur-3xl z-0" />
                    <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-rose-100/20 dark:bg-rose-950/5 rounded-full blur-3xl z-0" />
                </div>

                <div className="bg-gradient-to-br from-[#802222] to-rose-900 text-white rounded-2xl p-5 shadow-lg shadow-rose-950/10 relative overflow-hidden group transition-all hover:scale-[1.02]">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                            <Wallet className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] font-medium text-white/80">Balance</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1 p-0 leading-none tracking-tight tabular-nums relative z-10">{currencyFormatter.format(stats?.balance || 0)}</h3>
                    <p className="text-xs text-white/90 font-medium mt-1 relative z-10">Số dư hiện tại</p>

                    <Wallet className="absolute -right-6 -bottom-6 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform -rotate-12" />
                    <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                </div>
            </section>

            {/* Section 3: Main Grid (Trips & Transactions) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Recent Trips with Tabs (8 cols) */}
                <div className="lg:col-span-6">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-rose-900/[0.03] border border-gray-100 dark:border-zinc-800">
                        <div className="flex flex-row items-center justify-between gap-4 pb-2 mb-6 relative z-10">
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Chuyến đi của bạn</h2>
                                <p className="text-[10px] font-medium text-muted-foreground/50">Theo dõi hành trình và đơn hàng</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="rounded-xl px-4 border-gray-200 text-[#802222] font-medium text-xs h-8 hover:bg-rose-50 hover:border-rose-200 transition-all">
                                <Link href="/dashboard/history">Lịch sử</Link>
                            </Button>
                        </div>

                        <Tabs defaultValue="active" className="w-full">
                            <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-gray-100/50 dark:bg-zinc-800/50 p-1 text-muted-foreground mb-6 border border-gray-100 dark:border-zinc-800 w-full sm:w-auto">
                                <TabsTrigger value="active" className="rounded-xl px-6 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all">
                                    Đang chạy ({activeTrips.length})
                                </TabsTrigger>
                                <TabsTrigger value="upcoming" className="rounded-xl px-6 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all">
                                    Sắp tới ({upcomingTrips.length})
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="rounded-xl px-6 py-2 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all">
                                    Chờ xử lý ({pendingBookings.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="active" className="mt-0 focus-visible:outline-none">
                                {activeTrips.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6">
                                        {activeTrips.map(trip => (
                                            <DashboardTripCard key={trip.id} booking={trip} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-gray-50/30 dark:bg-zinc-800/20 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-zinc-800">
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <Train className="h-7 w-7 text-gray-200" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground mt-2">Không có chuyến đang hành trình</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="upcoming" className="mt-0 focus-visible:outline-none">
                                {upcomingTrips.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6">
                                        {upcomingTrips.map((booking) => (
                                            <DashboardTripCard key={booking.id} booking={booking} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-gray-50/30 dark:bg-zinc-800/20 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-zinc-800">
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <Calendar className="h-7 w-7 text-gray-200" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground mt-2">Không có chuyến đi sắp tới</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
                                {pendingBookings.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6">
                                        {pendingBookings.map((booking) => (
                                            <DashboardTripCard key={booking.id} booking={booking} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-gray-50/30 dark:bg-zinc-800/20 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-zinc-800">
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <Ticket className="h-7 w-7 text-gray-200" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground mt-2">Không có đơn hàng chờ xử lý</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

            {/* Right Side: Quick Actions & Transactions (4 cols) */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Recent Transactions */}
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-rose-900/[0.03] border border-gray-100 dark:border-zinc-800 overflow-hidden">
                        <div className="flex flex-row items-center justify-between gap-4 pb-2 mb-6 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Giao dịch</h3>
                                <p className="text-[10px] font-medium text-muted-foreground/50">Các hoạt động tài chính gần đây</p>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-medium text-[#802222] hover:bg-rose-50 rounded-xl">
                                <Link href="/dashboard/wallet">Tất cả</Link>
                            </Button>
                        </div>
                        <div className="pt-0">
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-4">
                                    {recentTransactions.slice(0, 5).map((tx) => (
                                        <DashboardTransactionItem key={tx.id} transaction={tx} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-gray-50/30 dark:bg-zinc-800/20 rounded-2xl border-2 border-dashed border-gray-100 dark:border-zinc-800">
                                    <p className="text-xs font-medium text-muted-foreground opacity-60">Chưa có giao dịch</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
