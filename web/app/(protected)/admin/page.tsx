"use client"

import * as React from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { RecentBookingsTable } from "@/components/recent-bookings-table"
import apiClient from "@/lib/api-client"
import { Loader2, TrendingUp, Train, Users, Ticket, Wallet, Plus, Map, Calendar, ChevronRight, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Page() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.get('/dashboard/admin');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    );
  }

  const stats = data?.stats;

  const getTrendBadge = (trend: number) => {
    const isPositive = trend >= 0;
    return (
      <Badge className={`font-semibold text-[10px] border-none shadow-none px-2 py-0.5 rounded-full ${
        isPositive 
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
          : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
      }`}>
        {isPositive ? "+" : ""}{trend}%
      </Badge>
    );
  };

  const currencyFormatter = new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  });

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
        {/* Header Block */}
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Bảng điều khiển</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium opacity-65">
                  Tổng quan hiệu suất hệ thống, doanh thu và thống kê vận hành thời gian thực.
                </p>
            </div>
        </div>
        
        {/* Grid 1: Analytics & Metrics block (Inspired by dashboard-shell-01 Statistics Block) */}
        <div className="grid grid-cols-12 gap-6">
            {/* Primary Analytics Card */}
            <div className="col-span-12 xl:col-span-6">
                <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl group hover:scale-[1.01] transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between p-6">
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none mb-1">
                          Tổng quan tài chính
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium opacity-70">Hiệu suất doanh thu và hoạt động đặt vé</p>
                    </div>

                    <div className="flex items-center gap-8 py-4 relative z-10 mt-4 sm:mt-0">
                        {/* Revenue Metric */}
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-muted-foreground/60 mb-1.5">Tổng doanh thu</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                                    {currencyFormatter.format(stats?.totalRevenue || 0)}
                                </span>
                                {getTrendBadge(stats?.revenueTrend ?? 0)}
                            </div>
                        </div>

                        <Separator orientation="vertical" className="h-12 bg-gray-200/50 dark:bg-zinc-800" />

                        {/* Bookings Metric */}
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-muted-foreground/60 mb-1.5">Tổng số vé đặt</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                                    {(stats?.totalBookings || 0).toLocaleString()}
                                </span>
                                {getTrendBadge(stats?.bookingsTrend ?? 0)}
                            </div>
                        </div>
                    </div>

                    {/* Decorative background gradient glow circles */}
                    <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-rose-500/22 to-pink-500/0 dark:from-[#802222]/38 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
                    <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-gradient-to-tr from-rose-500/18 to-pink-500/0 dark:from-[#802222]/22 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
                </Card>
            </div>

            {/* Secondary Stat Cards (2 Cards) */}
            <div className="col-span-12 xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Users Stat Card */}
                <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 group hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full">
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-semibold text-muted-foreground/60">Người dùng hệ thống</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                                        {(stats?.totalUsers || 0).toLocaleString()}
                                    </p>
                                    {getTrendBadge(stats?.usersTrend ?? 0)}
                                </div>
                            </div>
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400">
                                <Users className="size-5" />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mt-4">Tổng số tài khoản hành khách đã đăng ký</p>
                    </div>

                    {/* Decorative background gradient glow circles */}
                    <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-rose-500/22 to-pink-500/0 dark:from-[#802222]/38 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
                    <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-gradient-to-tr from-rose-500/18 to-pink-500/0 dark:from-[#802222]/22 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
                </Card>

                {/* Active Trains Stat Card */}
                <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 group hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full">
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-semibold text-muted-foreground/60">Tàu đang hoạt động</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                                        {stats?.activeTrains || 0}
                                    </p>
                                    <Badge className="font-semibold text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-none shadow-none px-2 py-0.5 rounded-full">
                                        Vận hành
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400">
                                <Train className="size-5" />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mt-4">Số đoàn tàu đang ở trạng thái ACTIVE</p>
                    </div>

                    {/* Decorative background gradient glow circles */}
                    <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-rose-500/22 to-pink-500/0 dark:from-[#802222]/38 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
                    <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-gradient-to-tr from-rose-500/18 to-pink-500/0 dark:from-[#802222]/22 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
                </Card>
            </div>
        </div>
        
        {/* Grid 2: Core Charts & Operational Shortcuts Widget */}
        <div className="grid grid-cols-12 gap-6">
            {/* Chart Block (8 Columns) */}
            <div className="col-span-12 xl:col-span-8">
                <ChartAreaInteractive data={data?.chartData} />
            </div>

            {/* Quick Actions/Shortcuts Widget (4 Columns) */}
            <div className="col-span-12 xl:col-span-4">
                <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 group hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">
                                  Thao tác nhanh
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium opacity-80">Phím tắt quản trị hệ thống</p>
                            </div>
                            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-[#802222] dark:text-rose-400">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </div>

                        {/* Shortcut Rows list */}
                        <div className="space-y-2 mt-4">
                            <Link href="/admin/trips/create" className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 hover:bg-rose-50/40 dark:bg-zinc-800/20 dark:hover:bg-rose-950/10 border border-gray-100/10 hover:border-rose-100/50 dark:hover:border-rose-900/20 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-rose-500 shadow-sm">
                                        <Calendar className="size-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">Thiết lập chuyến đi</p>
                                        <p className="text-[9px] text-muted-foreground">Tạo và lập lịch trình mới</p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground/40 group-hover/item:text-[#802222] group-hover/item:translate-x-0.5 transition-all" />
                            </Link>

                            <Link href="/admin/trains" className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 hover:bg-rose-50/40 dark:bg-zinc-800/20 dark:hover:bg-rose-950/10 border border-gray-100/10 hover:border-rose-100/50 dark:hover:border-rose-900/20 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-rose-500 shadow-sm">
                                        <Train className="size-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">Quản lý tàu & toa</p>
                                        <p className="text-[9px] text-muted-foreground">Thêm, sửa đổi sơ đồ tàu</p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground/40 group-hover/item:text-[#802222] group-hover/item:translate-x-0.5 transition-all" />
                            </Link>

                            <Link href="/admin/routes" className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 hover:bg-rose-50/40 dark:bg-zinc-800/20 dark:hover:bg-rose-950/10 border border-gray-100/10 hover:border-rose-100/50 dark:hover:border-rose-900/20 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-rose-500 shadow-sm">
                                        <Map className="size-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">Lộ trình mạng lưới</p>
                                        <p className="text-[9px] text-muted-foreground">Định cấu hình các ga dừng</p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground/40 group-hover/item:text-[#802222] group-hover/item:translate-x-0.5 transition-all" />
                            </Link>

                            <Link href="/admin/finance/withdrawals" className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 hover:bg-rose-50/40 dark:bg-zinc-800/20 dark:hover:bg-rose-950/10 border border-gray-100/10 hover:border-rose-100/50 dark:hover:border-rose-900/20 transition-all group/item">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-rose-500 shadow-sm">
                                        <Wallet className="size-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">Duyệt rút tiền ví</p>
                                        <p className="text-[9px] text-muted-foreground">Xử lý yêu cầu rút tiền ví</p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground/40 group-hover/item:text-[#802222] group-hover/item:translate-x-0.5 transition-all" />
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>

        {/* Grid 3: Recent Bookings Table (Full Width) */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none uppercase">Đơn hàng gần đây</h3>
            <RecentBookingsTable data={data?.recentBookings || []} />
        </div>
    </div>
  )
}
