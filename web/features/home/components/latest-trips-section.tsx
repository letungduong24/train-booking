"use client"

import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ArrowRight, CalendarClock, TrainFront, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTrips } from "@/features/trips/hooks/use-trips"
import { TripStatusBadge } from "@/lib/utils/trip-status"

export function LatestTripsSection() {
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
                        <Link href="/booking">
                            Tìm chuyến khác
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex flex-wrap gap-6">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-64 animate-pulse rounded-3xl border border-border bg-muted/60 flex-1 basis-[min(100%,18rem)]"
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
                    <div className="flex flex-wrap gap-6">
                        {trips.map((trip) => {
                            const firstStationId = trip.route?.stations?.[0]?.stationId
                            const lastStationId = trip.route?.stations?.[trip.route.stations.length - 1]?.stationId
                            const bookingHref = firstStationId && lastStationId
                                ? `/booking/${trip.id}?from=${firstStationId}&to=${lastStationId}`
                                : `/booking/${trip.id}`

                            return (
                            <article
                                key={trip.id}
                                className="flex-1 basis-[min(100%,18rem)] rounded-3xl border border-border bg-card p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="mt-2 text-2xl font-bold leading-tight text-foreground">
                                        {trip.route?.name || "Chuyến tàu"}
                                    </h3>
                                    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
                                        <TrainFront className="h-4 w-4 text-primary" />
                                        <span className="font-bold">{trip.train?.name || "Đang cập nhật đầu tàu"}</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-end justify-between border-t border-border pt-5">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                                            Khởi hành
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-foreground">
                                            {format(new Date(trip.departureTime), "HH:mm '•' EEEE, dd/MM/yyyy", { locale: vi })}                                        </p>
                                    </div>

                                    <Button asChild>
                                        <Link href={bookingHref}>
                                            Đặt vé
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </article>
                        )})}
                    </div>
                )}
            </div>
        </section>
    )
}