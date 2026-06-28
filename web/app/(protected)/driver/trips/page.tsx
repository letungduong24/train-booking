"use client"

import * as React from "react"
import apiClient from "@/lib/api-client"
import { Loader2, Train, Calendar, ChevronRight, MapPin, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { format, isPast, isToday, isThisWeek } from "date-fns"
import { vi } from "date-fns/locale"
import {
  getActualDepartureTime,
  getActualEndTime,
  hasArrivalImpactDelay,
  hasDepartureDelay,
} from "@/lib/utils/trip-time"

export default function TripsPage() {
  const [trips, setTrips] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await apiClient.get('/driver/trips');
        setTrips(response.data || []);
      } catch (error) {
        console.error("Failed to fetch driver trips:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    );
  }

  // Filter logic
  const canReportTrip = (trip: any) => {
    const actualEndTime = getActualEndTime(trip);
    return Boolean(trip.canReportSeatIssue) && actualEndTime !== null && !isPast(actualEndTime);
  };

  const todayTrips = trips.filter((t) => {
    const depDate = getActualDepartureTime(t);
    return isToday(depDate) && canReportTrip(t);
  });

  const weekTrips = trips.filter((t) => {
    const depDate = getActualDepartureTime(t);
    return isThisWeek(depDate) && !isToday(depDate) && canReportTrip(t);
  });

  const historyTrips = trips.filter((t) => {
    return t.status === 'COMPLETED' || t.status === 'CANCELLED' || !canReportTrip(t);
  });

  const renderTripCard = (trip: any) => {
    const actualEndTime = getActualEndTime(trip);
    const timeStr = format(getActualDepartureTime(trip), "HH:mm - dd/MM/yyyy", { locale: vi });
    const endTimeStr = actualEndTime ? format(actualEndTime, "HH:mm - dd/MM/yyyy", { locale: vi }) : "N/A";
    const originalTimeStr = format(new Date(trip.departureTime), "HH:mm - dd/MM/yyyy", { locale: vi });
    const originalEndTimeStr = trip.endTime ? format(new Date(trip.endTime), "HH:mm - dd/MM/yyyy", { locale: vi }) : "N/A";
    const isDepartureDelayed = hasDepartureDelay(trip);
    const isArrivalDelayed = hasArrivalImpactDelay(trip);

    return (
      <Card
        key={trip.id}
        className="rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 shadow-md hover:shadow-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl group hover:scale-[1.005] transition-all duration-300 overflow-hidden"
      >
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400 mt-1">
                <Train className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">{trip.train?.name || "Tàu hỏa"}</h4>
                  <Badge className="text-[9px] font-bold px-2 py-0.5 rounded-full border-none bg-rose-100 text-[#802222] dark:bg-rose-950/50 dark:text-rose-400">
                    {trip.train?.code}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {trip.route?.name || "Lộ trình di chuyển"}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-start gap-1">
                    <Clock className="size-3" />
                    <span className="flex flex-col gap-0.5">
                      {isDepartureDelayed && <span className="line-through opacity-60">Đi gốc: {originalTimeStr}</span>}
                      <span className={isDepartureDelayed ? "text-rose-600 font-bold" : ""}>Đi: {timeStr}</span>
                    </span>
                  </span>
                  <span className="flex items-start gap-1">
                    <Clock className="size-3" />
                    <span className="flex flex-col gap-0.5">
                      {isArrivalDelayed && <span className="line-through opacity-60">Đến gốc: {originalEndTimeStr}</span>}
                      <span className={isArrivalDelayed ? "text-rose-600 font-bold" : ""}>Đến: {endTimeStr}</span>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-4 sm:pt-0 border-gray-100 dark:border-zinc-800">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Trạng thái</span>
                <Badge className={`text-[9px] px-2.5 py-0.5 rounded-full border-none font-bold mt-1 ${
                  trip.status === "SCHEDULED"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                    : trip.status === "IN_PROGRESS"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    : trip.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                }`}>
                  {trip.status === "SCHEDULED" ? "Sắp chạy" : trip.status === "IN_PROGRESS" ? "Đang chạy" : trip.status === "COMPLETED" ? "Đã hoàn thành" : "Đã hủy"}
                </Badge>
              </div>

              <Button asChild size="sm" className="rounded-xl h-9 px-4 bg-[#802222] hover:bg-rose-900 text-white font-bold text-xs border-none flex items-center gap-1 shadow-md shadow-rose-900/10">
                <Link href={`/driver/trips/${trip.id}`}>
                  Chi tiết
                  <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Danh sách chuyến xe</h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium opacity-65">
          Quản lý lịch trình di chuyển cá nhân và theo dõi lịch sử chuyến đi của bạn.
        </p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="flex inline-flex w-auto h-11 items-center justify-start rounded-xl bg-gray-100/50 dark:bg-zinc-800/50 p-1 text-muted-foreground mb-6 border border-gray-100 dark:border-zinc-800/20 max-w-full">
          <TabsTrigger value="today" className="rounded-lg px-6 py-1.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all whitespace-nowrap">
            Chuyến hôm nay ({todayTrips.length})
          </TabsTrigger>
          <TabsTrigger value="week" className="rounded-lg px-6 py-1.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all whitespace-nowrap">
            Chuyến tuần này ({weekTrips.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg px-6 py-1.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#802222] transition-all whitespace-nowrap">
            Lịch sử chuyến ({historyTrips.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-0 space-y-4 focus-visible:outline-none">
          {todayTrips.length > 0 ? (
            todayTrips.map(renderTripCard)
          ) : (
            <div className="text-center py-20 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
              <p className="text-xs font-semibold text-muted-foreground opacity-60">Bạn không có chuyến xe nào được phân công hôm nay</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-0 space-y-4 focus-visible:outline-none">
          {weekTrips.length > 0 ? (
            weekTrips.map(renderTripCard)
          ) : (
            <div className="text-center py-20 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
              <p className="text-xs font-semibold text-muted-foreground opacity-60">Không có chuyến đi được phân công trong tuần này</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0 space-y-4 focus-visible:outline-none">
          {historyTrips.length > 0 ? (
            historyTrips.map(renderTripCard)
          ) : (
            <div className="text-center py-20 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
              <p className="text-xs font-semibold text-muted-foreground opacity-60">Chưa có lịch sử chuyến xe nào được ghi nhận</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
