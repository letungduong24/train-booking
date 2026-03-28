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
    const effectiveDepartureTime = trip.departureDelayMinutes
        ? addMinutes(new Date(trip.departureTime), trip.departureDelayMinutes)
        : new Date(trip.departureTime);

    const effectiveEndTime = trip.arrivalDelayMinutes
        ? addMinutes(new Date(trip.endTime), trip.arrivalDelayMinutes)
        : new Date(trip.endTime);

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2.5rem] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] relative overflow-hidden group">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-[#802222] dark:text-rose-400 flex items-center justify-center border border-rose-100/50 dark:border-rose-900/20">
                        <Calendar className="w-6 h-6 opacity-70" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Khởi hành</span>
                        <div className="flex items-center gap-2">
                            {trip.departureDelayMinutes ? (
                                <>
                                    <span className="line-through opacity-30 text-xs">
                                        {format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <span className="text-lg font-bold text-rose-600">
                                        {format(effectiveDepartureTime, 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <Badge variant="destructive" className="h-4 px-1 text-[8px] rounded-full bg-rose-500 hover:bg-rose-600 border-none shadow-sm">
                                        +{trip.departureDelayMinutes}m
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
                        <div className="flex items-center gap-2">
                            {trip.arrivalDelayMinutes ? (
                                <>
                                    <span className="line-through opacity-30 text-xs">
                                        {format(new Date(trip.endTime), 'HH:mm dd/MM/yyyy')}
                                    </span>
                                    <span className="text-lg font-bold text-rose-600">
                                        {format(effectiveEndTime, 'HH:mm dd/MM/yyyy')}
                                    </span>
                                </>
                            ) : (
                                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{format(new Date(trip.endTime), 'HH:mm dd/MM/yyyy')}</span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-2xl z-0" />
            </div>
        </div>
    );
}
