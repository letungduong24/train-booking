import { Badge } from "@/components/ui/badge";
import { TripDetail } from "@/lib/schemas/trip.schema";
import { format, addMinutes } from "date-fns";
import { vi } from "date-fns/locale";
import { Train, MapPin, Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTripStats } from "@/features/trips/hooks/use-trip-stats";
import { TripStatusBadge } from "@/lib/utils/trip-status";

interface AdminTripHeaderProps {
    trip: TripDetail;
}

export function AdminTripHeader({ trip }: AdminTripHeaderProps) {
    const { data: stats } = useTripStats(trip.id);

    const effectiveDepartureTime = trip.departureDelayMinutes
        ? addMinutes(new Date(trip.departureTime), trip.departureDelayMinutes)
        : new Date(trip.departureTime);

    const effectiveEndTime = trip.arrivalDelayMinutes
        ? addMinutes(new Date(trip.endTime), trip.arrivalDelayMinutes)
        : new Date(trip.endTime);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {trip.train?.code}-{format(new Date(trip.departureTime), 'yyyyMMdd')}
                        </h1>
                        <TripStatusBadge status={trip.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm flex-wrap">
                        <Train className="w-4 h-4" />
                        <span>{trip.train?.name}</span>
                        <span className="mx-2">•</span>
                        <MapPin className="w-4 h-4" />
                        <span>{trip.route?.name}</span>
                        <span className="mx-2">•</span>
                        <Calendar className="w-4 h-4" />

                        <div className="flex items-center gap-1">
                            <span>Đi:</span>
                            {trip.departureDelayMinutes ? (
                                <>
                                    <span className="line-through text-xs opacity-70">
                                        {format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <span className="font-medium text-destructive">
                                        {format(effectiveDepartureTime, 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px] ml-1">
                                        Delay {trip.departureDelayMinutes} phút
                                    </Badge>
                                </>
                            ) : (
                                <span>{format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy', { locale: vi })}</span>
                            )}
                        </div>

                        <span className="mx-2">-</span>

                        <div className="flex items-center gap-1">
                            <span>Đến:</span>
                            {trip.arrivalDelayMinutes ? (
                                <>
                                    <span className="line-through text-xs opacity-70">
                                        {format(new Date(trip.endTime), 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <span className="font-medium text-destructive">
                                        {format(effectiveEndTime, 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px] ml-1">
                                        Delay {trip.arrivalDelayMinutes} phút
                                    </Badge>
                                </>
                            ) : (
                                <span>{format(new Date(trip.endTime), 'HH:mm dd/MM/yyyy', { locale: vi })}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Realtime KPIs */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Doanh thu dự kiến</p>
                        <p className="text-2xl font-bold">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Tỷ lệ lấp đầy</p>
                        <p className="text-2xl font-bold">{stats.occupancy}%</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Vé đã bán</p>
                        <p className="text-2xl font-bold">{stats.ticketsSold}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Giữ chỗ (Pending)</p>
                        <p className="text-2xl font-bold">{stats.ticketsPending}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
