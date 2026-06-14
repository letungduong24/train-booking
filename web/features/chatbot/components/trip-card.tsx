"use client";

import Link from "next/link";
import { format, addMinutes } from "date-fns";
import { vi } from "date-fns/locale";
import { Train, MapPin, Clock, ArrowRight, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TripCardData {
    tripId: string;
    routeName: string;
    trainCode: string;
    departureTime: string;
    endTime: string;
    fromStation: string;
    toStation: string;
    fromStationId: string;
    toStationId: string;
    durationFromStart: number; // minutes offset from departure
    durationToEnd: number;     // minutes offset from departure
    totalSeats: number;
    status: string;
}

interface TripCardProps {
    trip: TripCardData;
    className?: string;
}

export function TripCard({ trip, className }: TripCardProps) {
    const departure = addMinutes(new Date(trip.departureTime), trip.durationFromStart);
    const arrival = addMinutes(new Date(trip.departureTime), trip.durationToEnd);
    const durationMin = trip.durationToEnd - trip.durationFromStart;
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;
    const durationLabel = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}p` : ""}` : `${minutes}p`;

    const bookingUrl = `/dashboard/booking/${trip.tripId}?from=${trip.fromStationId}&to=${trip.toStationId}`;

    return (
        <div
            className={cn(
                "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary/5 px-4 py-2 border-b gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground min-w-0">
                    <Train className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{trip.routeName}</span>
                    <span className="text-muted-foreground/50 shrink-0">•</span>
                    <span className="font-mono text-primary shrink-0">{trip.trainCode}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                    {trip.totalSeats} chỗ
                </Badge>
            </div>

            {/* Journey */}
            <div className="px-4 py-3 flex items-center gap-2 sm:gap-4 justify-between">
                {/* Departure */}
                <div className="min-w-0 text-center shrink-0 w-20 sm:w-24">
                    <p className="text-lg font-bold tabular-nums leading-none mb-1">
                        {format(departure, "HH:mm")}
                    </p>
                    <div className="h-8 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground font-semibold line-clamp-2 leading-tight" title={trip.fromStation}>
                            {trip.fromStation}
                        </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {format(departure, "dd/MM", { locale: vi })}
                    </p>
                </div>

                {/* Duration */}
                <div className="flex-1 flex flex-col items-center gap-0.5 min-w-[40px]">
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{durationLabel}</span>
                    <div className="relative w-full flex items-center">
                        <div className="flex-1 h-px bg-border" />
                        <ArrowRight className="h-3 w-3 text-muted-foreground mx-0.5 shrink-0" />
                        <div className="flex-1 h-px bg-border" />
                    </div>
                </div>

                {/* Arrival */}
                <div className="min-w-0 text-center shrink-0 w-20 sm:w-24">
                    <p className="text-lg font-bold tabular-nums leading-none mb-1">
                        {format(arrival, "HH:mm")}
                    </p>
                    <div className="h-8 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground font-semibold line-clamp-2 leading-tight" title={trip.toStation}>
                            {trip.toStation}
                        </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {format(arrival, "dd/MM", { locale: vi })}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-3">
                <Button asChild size="sm" className="w-full h-8 gap-1.5 text-xs font-semibold">
                    <Link href={bookingUrl}>
                        <TicketCheck className="h-3.5 w-3.5" />
                        Đặt vé ngay
                    </Link>
                </Button>
            </div>
        </div>
    );
}
