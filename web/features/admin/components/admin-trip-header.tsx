import { Badge } from "@/components/ui/badge";
import { TripDetail } from "@/lib/schemas/trip.schema";
import { format, addMinutes } from "date-fns";
import { vi } from "date-fns/locale";
import { Train, MapPin, Calendar, Clock, AlertTriangle, CheckCircle2, User } from "lucide-react";
import { useTripStats } from "@/features/trips/hooks/use-trip-stats";
import { TripStatusBadge } from "@/lib/utils/trip-status";
import {
    getActualArrivalTimeFromScheduled,
    getActualDepartureTime,
    getDepartureDelayMinutes,
    getTotalArrivalDelayMinutes,
} from "@/lib/utils/trip-time";

interface AdminTripHeaderProps {
    trip: TripDetail;
}

export function AdminTripHeader({ trip }: AdminTripHeaderProps) {
    const departureDelayMinutes = getDepartureDelayMinutes(trip);
    const totalArrivalDelayMinutes = getTotalArrivalDelayMinutes(trip);
    const effectiveDepartureTime = getActualDepartureTime(trip);

    // Tính toán thời gian cập bến thực sự của ga cuối (không gồm turnaround)
    const stations = [...(trip.route?.stations || [])].sort((a, b) => a.index - b.index);
    const lastStation = stations[stations.length - 1];
    
    const speed = trip.train?.averageSpeedKmH;
    let durationMinutes = 0;
    if (lastStation) {
        if (speed && speed > 0 && lastStation.distanceFromStart !== undefined) {
            durationMinutes = Math.round((lastStation.distanceFromStart / speed) * 60);
        } else {
            durationMinutes = lastStation.durationFromStart || 0;
        }
    }

    const scheduledArrival = addMinutes(new Date(trip.departureTime), durationMinutes);
    const actualArrival = getActualArrivalTimeFromScheduled(scheduledArrival, trip);

    // Thời gian giải phóng tàu sau khi nghỉ quay đầu (bằng thời gian cập bến thực tế + turnaroundMinutes)
    const turnaroundMinutes = trip.route?.turnaroundMinutes ?? 60;
    const effectiveEndTimeWithTurnaround = addMinutes(actualArrival, turnaroundMinutes);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-[#802222] dark:text-rose-400 shadow-sm border border-rose-100/50 dark:border-rose-900/20">
                            <Train className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">
                                    {trip.train?.code}-{format(new Date(trip.departureTime), 'yyyyMMdd')}
                                </h1>
                                <TripStatusBadge status={trip.status} />
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground/60 text-xs font-medium flex-wrap">
                                <span>{trip.train?.name}</span>
                                <span className="opacity-30">•</span>
                                <span>{trip.route?.name}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-[2.5rem] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] relative overflow-hidden group">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-[#802222] dark:text-rose-400 flex items-center justify-center border border-rose-100/50 dark:border-rose-900/20">
                        <Calendar className="w-6 h-6 opacity-70" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Khởi hành</span>
                        <div className="flex items-center gap-2">
                            {departureDelayMinutes > 0 ? (
                                <>
                                    <span className="line-through opacity-30 text-xs">
                                        {format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <span className="text-lg font-bold text-rose-600">
                                        {format(effectiveDepartureTime, 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <Badge variant="destructive" className="h-4 px-1 text-[8px] rounded-full bg-rose-500 hover:bg-rose-600 border-none shadow-sm">
                                        +{departureDelayMinutes}m
                                    </Badge>
                                </>
                            ) : (
                                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/50 dark:border-blue-900/20">
                        <Clock className="w-6 h-6 opacity-70" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Dự kiến đến</span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {totalArrivalDelayMinutes > 0 ? (
                                <>
                                    <span className="line-through opacity-30 text-xs">
                                        {format(scheduledArrival, 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <span className="text-lg font-bold text-rose-600">
                                        {format(actualArrival, 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <Badge variant="destructive" className="h-4 px-1 text-[8px] rounded-full bg-rose-500 hover:bg-rose-600 border-none shadow-sm">
                                        +{totalArrivalDelayMinutes}m
                                    </Badge>
                                </>
                            ) : (
                                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                                    {format(actualArrival, 'HH:mm dd/MM/yyyy')}
                                </span>
                            )}
                            <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20 whitespace-nowrap">
                                +{turnaroundMinutes}m nghỉ quay đầu
                            </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 font-medium">
                            Giải phóng tàu: {format(effectiveEndTimeWithTurnaround, 'HH:mm dd/MM/yyyy')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100/50 dark:border-amber-900/20">
                        <User className="w-6 h-6 opacity-70" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Lái tàu phụ trách</span>
                        {trip.driver ? (
                            <>
                                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                                    {trip.driver.name || "Lái tàu"}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60 font-medium whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                                    {trip.driver.email}
                                </span>
                                {trip.driver.phone && (
                                    <span className="text-[10px] text-muted-foreground/50 font-medium">
                                        SĐT: {trip.driver.phone}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-sm font-semibold text-muted-foreground/50 opacity-60 italic">
                                Chưa phân công
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-2xl z-0" />
            </div>
        </div>
    );
}
