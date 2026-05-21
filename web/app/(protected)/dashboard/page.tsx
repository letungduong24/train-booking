'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard-overview';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Clock, CreditCard, History, Ticket, ArrowRight, Train, Wallet, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

import { DashboardTripCard, DashboardTransactionItem } from '@/features/dashboard/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    const { data: overview, isLoading } = useDashboardOverview();

    if (isLoading && !user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Spinner className="h-8 w-8 text-[#802222]" />
            </div>
        );
    }

    const stats = overview?.stats;
    const upcomingTrips = overview?.upcomingTrips || [];
    const pendingBookings = overview?.pendingBookings || [];
    const recentTransactions = overview?.recentTransactions || [];
    const activeTrips = overview?.activeTrips || [];

    const currencyFormatter = new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    });

    return (
        <div className="flex flex-1 flex-col gap-6">
            {/* Grid 1: Welcome Banner & Quick Wallet Card */}
            <div className="grid grid-cols-12 gap-6">
                {/* Welcome Banner */}
                <div className="col-span-12 xl:col-span-8">
                    <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#802222] to-rose-900 shadow-xl flex items-center p-8 text-white group border border-rose-800/20 h-full min-h-[220px]">
                        <div className="z-10 max-w-2xl relative">
                            <p className="text-xs font-semibold mb-1.5 opacity-80 uppercase tracking-widest text-rose-200">Xin chào trở lại</p>
                            <h1 className="text-2xl sm:text-3xl font-black mb-4 leading-tight tracking-tight">
                                Chúc {user?.name?.split(' ')[0] || 'bạn'} một ngày <br/>
                                hành trình <span className="text-rose-200 underline decoration-rose-300 underline-offset-4">tuyệt vời!</span>
                            </h1>
                            <div className="flex flex-wrap gap-3">
                                <Button 
                                    asChild 
                                    className="bg-white text-[#802222] hover:bg-rose-50 font-bold text-xs h-10 px-6 rounded-xl transition-all shadow-lg shadow-rose-950/20 hover:scale-[1.03] active:scale-95 border-none"
                                >
                                    <Link href="/dashboard/booking" className="flex items-center gap-2">
                                        <Ticket className="h-3.5 w-3.5" />
                                        Đặt vé ngay
                                    </Link>
                                </Button>
                                
                                <Button 
                                    variant="outline"
                                    asChild 
                                    className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs h-10 px-5 rounded-xl transition-all backdrop-blur-md hover:scale-[1.03] active:scale-95 hover:text-white"
                                >
                                    <Link href="/dashboard/wallet" className="flex items-center gap-2">
                                        <Wallet className="h-3.5 w-3.5" />
                                        Ví tiền
                                    </Link>
                                </Button>

                                <Button 
                                    variant="outline"
                                    asChild 
                                    className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs h-10 px-5 rounded-xl transition-all backdrop-blur-md hover:scale-[1.03] active:scale-95 hover:text-white"
                                >
                                    <Link href="/dashboard/history" className="flex items-center gap-2">
                                        <History className="h-3.5 w-3.5" />
                                        Lịch sử
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute right-0 top-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-12 -z-0" />
                        <Train className="absolute -right-20 -bottom-10 w-96 h-96 opacity-[0.03] -rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </div>

                {/* Quick Balance Card */}
                <div className="col-span-12 xl:col-span-4">
                    <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl group hover:scale-[1.01] transition-all duration-300 overflow-hidden relative h-full flex flex-col justify-between p-6">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400">
                                    <Wallet className="size-5" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground/60">Ví của tôi</span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400 tabular-nums">
                                {currencyFormatter.format(stats?.balance || 0)}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Nạp hoặc thanh toán vé tàu cực kỳ nhanh chóng bằng ví điện tử Railflow.</p>
                        </div>
                        <div className="mt-6 relative z-10">
                            <Button asChild size="sm" className="w-full h-10 rounded-xl bg-[#802222] text-white hover:bg-rose-900 border-none shadow-md shadow-rose-900/10 transition-all hover:scale-[1.01] active:scale-95 group">
                                <Link href="/dashboard/wallet" className="flex items-center justify-center gap-2">
                                    <span className="font-bold text-xs">Quản lý ví & Nạp tiền</span>
                                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>


            {/* Grid 3: Trips & Activity Tabulated Layout */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Side: Recent Trips Tabs (8 cols) */}
                <div className="col-span-12 xl:col-span-8">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-rose-900/[0.03] dark:shadow-none border border-gray-100 dark:border-zinc-800 h-full flex flex-col justify-between overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex flex-row items-center justify-between gap-4 pb-2 mb-6 relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Chuyến đi của bạn</h2>
                                    <p className="text-xs text-muted-foreground font-medium opacity-80">Theo dõi hành trình và đơn đặt vé</p>
                                </div>
                                <Button variant="outline" size="sm" asChild className="rounded-xl px-4 border-[#802222]/20 text-[#802222] dark:text-rose-400 dark:border-rose-900/30 font-bold text-xs h-8 hover:bg-[#802222] hover:text-white dark:hover:bg-rose-950/50 transition-all duration-300">
                                    <Link href="/dashboard/history">Lịch sử</Link>
                                </Button>
                            </div>

                            <Tabs defaultValue="active" className="w-full">
                                <TabsList className="flex sm:inline-flex w-full sm:w-auto h-11 items-center justify-start rounded-xl bg-gray-100/50 dark:bg-zinc-800/50 p-1 text-muted-foreground mb-6 border border-gray-100 dark:border-zinc-800/20 max-w-full overflow-x-auto hide-scrollbar">
                                    <TabsTrigger value="active" className="rounded-lg px-4 sm:px-6 py-1.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all whitespace-nowrap flex-none">
                                        Đang chạy ({activeTrips.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="upcoming" className="rounded-lg px-4 sm:px-6 py-1.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all whitespace-nowrap flex-none">
                                        Sắp tới ({upcomingTrips.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="pending" className="rounded-lg px-4 sm:px-6 py-1.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all whitespace-nowrap flex-none">
                                        Chờ xử lý ({pendingBookings.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="active" className="mt-0 focus-visible:outline-none">
                                    {activeTrips.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 max-h-[480px] overflow-y-auto pt-2 pl-2 pr-1.5 pb-6 scrollbar-thin">
                                            {activeTrips.map(trip => (
                                                <DashboardTripCard key={trip.id} booking={trip} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
                                            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-50 dark:border-zinc-800">
                                                <Train className="h-6 w-6 text-gray-300" />
                                            </div>
                                            <p className="text-xs font-semibold text-muted-foreground opacity-60">Không có chuyến tàu đang hành trình</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="upcoming" className="mt-0 focus-visible:outline-none">
                                    {upcomingTrips.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 max-h-[480px] overflow-y-auto pt-2 pl-2 pr-1.5 pb-6 scrollbar-thin">
                                            {upcomingTrips.map((booking) => (
                                                <DashboardTripCard key={booking.id} booking={booking} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
                                            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-50 dark:border-zinc-800">
                                                <Calendar className="h-6 w-6 text-gray-300" />
                                            </div>
                                            <p className="text-xs font-semibold text-muted-foreground opacity-60">Không có chuyến đi sắp tới</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
                                    {pendingBookings.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 max-h-[480px] overflow-y-auto pt-2 pl-2 pr-1.5 pb-6 scrollbar-thin">
                                            {pendingBookings.map((booking) => (
                                                <DashboardTripCard key={booking.id} booking={booking} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
                                            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-50 dark:border-zinc-800">
                                                <Ticket className="h-6 w-6 text-gray-300" />
                                            </div>
                                            <p className="text-xs font-semibold text-muted-foreground opacity-60">Không có đơn hàng chờ xử lý</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Right Side: Financial Activity Widget (4 cols) */}
                <div className="col-span-12 xl:col-span-4">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-rose-900/[0.03] dark:shadow-none border border-gray-100 dark:border-zinc-800 overflow-hidden h-full flex flex-col justify-between relative">
                        <div className="relative z-10">
                            <div className="flex flex-row items-center justify-between gap-4 pb-2 mb-6 relative z-10">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Hoạt động tài chính</h3>
                                    <p className="text-xs text-muted-foreground font-medium opacity-80">Giao dịch ví gần đây</p>
                                </div>
                                <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-bold text-[#802222] hover:bg-rose-50 rounded-xl">
                                    <Link href="/dashboard/wallet">Tất cả</Link>
                                </Button>
                            </div>
                            <div className="pt-0">
                                {recentTransactions.length > 0 ? (
                                    <div className="space-y-3.5 max-h-[480px] overflow-y-auto pt-2 pl-2 pr-1.5 pb-6 scrollbar-thin">
                                        {recentTransactions.map((tx) => (
                                            <DashboardTransactionItem key={tx.id} transaction={tx} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-gray-50/20 dark:bg-zinc-800/10 rounded-2xl border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
                                        <p className="text-xs font-semibold text-muted-foreground opacity-55">Chưa có giao dịch phát sinh</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
