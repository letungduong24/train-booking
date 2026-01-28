import { Badge } from "@/components/ui/badge";
import { TripDetail } from "@/lib/schemas/trip.schema";
import { format, addMinutes } from "date-fns";
import { vi } from "date-fns/locale";
import { Train, MapPin, Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatsCards } from "./stats-cards";
import { TripStatusBadge } from "@/lib/utils/trip-status";

interface AdminTripHeaderProps {
    trip: TripDetail;
}

export function AdminTripHeader({ trip }: AdminTripHeaderProps) {
    const revenue = 150000000; // Mock 150tr
    const totalSeats = trip.train?.coaches.reduce((acc, coach) => {

        return acc + (coach._count?.seats || 40); // Default 40 if missing
    }, 0) || 100;

    const ticketsSold = trip._count?.tickets || 0;
    const ticketsPending = 50; // Mock
    const occupancy = Math.round((ticketsSold / totalSeats) * 100);


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

            {/* KPIs */}
            {/* KPIs */}
            <StatsCards stats={[
                {
                    title: "Doanh thu dự kiến",
                    value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(revenue),
                },
                {
                    title: "Tỷ lệ lấp đầy",
                    value: `${occupancy}%`,
                },
                {
                    title: "Vé đã bán",
                    value: ticketsSold.toString(),
                },
                {
                    title: "Giữ chỗ (Pending)",
                    value: ticketsPending.toString(),
                }
            ]} />
        </div>
    );
}
