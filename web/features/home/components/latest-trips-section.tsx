"use client"

import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ArrowRight, CalendarClock, TrainFront, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTrips } from "@/features/trips/hooks/use-trips"
import { TripStatusBadge } from "@/lib/utils/trip-status"

import { useAuthStore } from "@/lib/store/auth.store"

export function LatestTripsSection() {
    const user = useAuthStore((state) => state.user)
    const { data, isLoading, isError } = useTrips({
        page: 1,
        limit: 3,
        upcoming: true,
        sort: "departureTime",
        order: "asc",
    })

    const trips = data?.data ?? []

    return (
        <section className="bg-background py-24 text-foreground">
            <div className="container mx-auto px-4">
                <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl font-extrabold text-foreground">
                            Các chuyến đi <span className="text-primary">sắp khởi hành</span>
                        </h2>
                    </div>

                    <Button asChild variant="outline" className="w-fit">
                        <Link href={user ? "/dashboard/booking" : "/booking"}>
                            Tìm chuyến khác
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-64 animate-pulse rounded-3xl border border-border bg-muted/60"
                            />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <TriangleAlert className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold">Không tải được danh sách chuyến</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            API trip hiện có lỗi hoặc chưa sẵn sàng. Bạn vẫn có thể vào trang tìm chuyến để thử lại sau.
                        </p>
                    </div>
                ) : trips.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <CalendarClock className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold">Chưa có chuyến sắp khởi hành</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Hệ thống hiện chưa mở bán chuyến nào trong thời gian tới.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {trips.map((trip) => {
                            const firstStationId = trip.route?.stations?.[0]?.stationId
                            const lastStationId = trip.route?.stations?.[trip.route.stations.length - 1]?.stationId
                            
                            const basePath = user ? "/dashboard/booking" : "/booking"
                            const bookingHref = firstStationId && lastStationId
                                ? `${basePath}/${trip.id}?from=${firstStationId}&to=${lastStationId}`
                                : `${basePath}/${trip.id}`

                            return (
                            <article
                                key={trip.id}
                                className="group relative rounded-3xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-2xl hover:shadow-rose-900/5 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden"
                            >
                                <div className="absolute -right-20 -top-20 w-40 h-40 bg-rose-50/50 dark:bg-rose-950/10 rounded-full blur-3xl group-hover:bg-rose-100/50 transition-colors" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-[10px] font-bold text-[#802222] dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 w-fit">
                                                <div className="size-1.5 bg-[#802222] dark:bg-rose-400 rounded-full animate-pulse" />
                                                SẮP KHỞI HÀNH
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-2">
                                                {trip.route?.name || "Chuyến tàu"}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-100 dark:border-zinc-800">
                                            <TrainFront className="h-3.5 w-3.5 text-[#802222] dark:text-rose-400" />
                                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{trip.train?.name || "Đầu tàu"}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">
                                                    Khởi hành
                                                </p>
                                                <p className="text-xl font-black text-[#802222] dark:text-rose-400 tabular-nums">
                                                    {format(new Date(trip.departureTime), "HH:mm")}
                                                </p>
                                                <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
                                                    {format(new Date(trip.departureTime), "EEEE, dd/MM/yyyy", { locale: vi })}
                                                </p>
                                            </div>

                                            <Button asChild className="rounded-xl h-10 px-6 bg-[#802222] hover:bg-rose-900 text-white shadow-lg shadow-rose-900/20 border-none transition-all group-hover:scale-105 active:scale-95">
                                                <Link href={bookingHref} className="flex items-center gap-2">
                                                    <span className="font-bold">Đặt vé ngay</span>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )})}
                    </div>
                )}
            </div>
        </section>
    )
}