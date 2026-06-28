"use client"

import * as React from "react"
import apiClient from "@/lib/api-client"
import { Loader2, Train, Calendar, AlertTriangle, ChevronRight, ArrowUpRight, ClipboardList } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { getActualDepartureTime, hasDepartureDelay } from "@/lib/utils/trip-time"

export default function Page() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiClient.get('/dashboard/driver');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch driver stats:", error);
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
  const recentTrips = data?.recentTrips || [];
  const recentIssues = data?.recentIssues || [];

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
      {/* Header Block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Khu vực Lái tàu</h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium opacity-65">
            Xem lịch trình di chuyển cá nhân và quản lý/báo cáo sự cố thiết bị trên tàu.
          </p>
        </div>
      </div>

      {/* Grid 1: Analytics & Metrics block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Trips Card */}
        <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 group hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-muted-foreground/60">Tổng chuyến xe được giao</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                    {stats?.totalTrips || 0}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400">
                <Train className="size-5" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-4">Số lượng hành trình bạn đã/đang phụ trách</p>
          </div>
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-rose-500/10 to-pink-500/0 dark:from-[#802222]/20 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
        </Card>

        {/* Upcoming Trips Card */}
        <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 group hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-muted-foreground/60">Chuyến xe sắp khởi hành</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                    {stats?.upcomingTripsCount || 0}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400">
                <Calendar className="size-5" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-4">Số chuyến xe sắp khởi hành cần chuẩn bị</p>
          </div>
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-rose-500/10 to-pink-500/0 dark:from-[#802222]/20 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
        </Card>

        {/* Reported Issues Card */}
        <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 group hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between relative overflow-hidden h-full">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-muted-foreground/60">Sự cố đã báo cáo</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                    {stats?.totalIssues || 0}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400">
                <AlertTriangle className="size-5" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-4">Số lượng sự cố ghế hỏng bạn đã gửi lên</p>
          </div>
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-rose-500/10 to-pink-500/0 dark:from-[#802222]/20 dark:to-transparent rounded-full blur-3xl z-0 pointer-events-none" />
        </Card>
      </div>

      {/* Grid 2: Left assigned trips list & Right reported issues list */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Recent assigned trips (7 cols) */}
        <div className="col-span-12 xl:col-span-7">
          <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 h-full flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-[#802222] dark:text-rose-400">Chuyến đi được phân công sắp tới</h3>
                  <p className="text-xs text-muted-foreground font-medium">Theo dõi lịch vận chuyển hành trình tiếp theo</p>
                </div>
                <Button variant="outline" size="sm" asChild className="rounded-xl border-[#802222]/20 text-[#802222] font-bold text-xs h-8">
                  <Link href="/driver/trips">Xem tất cả</Link>
                </Button>
              </div>

              {recentTrips.length > 0 ? (
                <div className="space-y-3.5">
                  {recentTrips.map((trip: any) => {
                    const timeStr = format(getActualDepartureTime(trip), "HH:mm, dd/MM/yyyy", { locale: vi });
                    const originalTimeStr = format(new Date(trip.departureTime), "HH:mm, dd/MM/yyyy", { locale: vi });
                    const isDepartureDelayed = hasDepartureDelay(trip);
                    return (
                      <Link
                        key={trip.id}
                        href={`/driver/trips/${trip.id}`}
                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-rose-50/40 dark:bg-zinc-800/20 dark:hover:bg-rose-950/10 border border-gray-100/10 hover:border-rose-100/50 dark:hover:border-rose-900/20 transition-all group/item"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-rose-500 shadow-sm">
                            <Train className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{trip.train?.name || "Tàu hỏa"}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{trip.route?.name || "Lộ trình"}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            {isDepartureDelayed && (
                              <p className="text-[10px] font-medium text-muted-foreground line-through">Gốc: {originalTimeStr}</p>
                            )}
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{timeStr}</p>
                            <Badge className="text-[8px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 border-none font-semibold mt-0.5">
                              {trip.status === "SCHEDULED" ? "Sắp chạy" : trip.status === "IN_PROGRESS" ? "Đang chạy" : "Đã hoàn thành"}
                            </Badge>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground/40 group-hover/item:text-[#802222] group-hover/item:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50/20 dark:bg-zinc-800/10 rounded-2xl border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
                  <p className="text-xs font-semibold text-muted-foreground opacity-55">Bạn chưa có lịch phân công chuyến xe nào</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Recent reported issues (5 cols) */}
        <div className="col-span-12 xl:col-span-5">
          <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] dark:shadow-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 h-full flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-[#802222] dark:text-rose-400">Sự cố báo cáo gần đây</h3>
                  <p className="text-xs text-muted-foreground font-medium">Báo cáo ghế hỏng gửi về hệ thống</p>
                </div>
                <Button variant="outline" size="sm" asChild className="rounded-xl border-[#802222]/20 text-[#802222] font-bold text-xs h-8">
                  <Link href="/driver/issues">Xem tất cả</Link>
                </Button>
              </div>

              {recentIssues.length > 0 ? (
                <div className="space-y-3.5">
                  {recentIssues.map((issue: any) => {
                    const issueTime = format(new Date(issue.createdAt), "dd/MM HH:mm", { locale: vi });
                    return (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/20 border border-gray-100/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-amber-500 shadow-sm">
                            <AlertTriangle className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              Ghế {issue.seat?.name || "N/A"} - Toa {issue.seat?.coach?.name || "N/A"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{issue.issueType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground font-semibold">{issueTime}</p>
                          <Badge className={`text-[8px] px-2 py-0.5 rounded-full border-none font-semibold mt-1 ${
                            issue.status === "PENDING"
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                              : issue.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : issue.status === "REJECTED"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          }`}>
                            {issue.status === "PENDING"
                              ? "Chờ xử lý"
                              : issue.status === "RESOLVED"
                              ? "Đã giải quyết"
                              : issue.status === "REJECTED"
                              ? "Bị từ chối"
                              : "Chờ khách đổi"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50/20 dark:bg-zinc-800/10 rounded-2xl border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
                  <p className="text-xs font-semibold text-muted-foreground opacity-55">Bạn chưa có báo cáo sự cố nào gần đây</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
