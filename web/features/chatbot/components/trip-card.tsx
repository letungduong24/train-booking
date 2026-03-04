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

    const bookingUrl = `/booking/${trip.tripId}?from=${trip.fromStationId}&to=${trip.toStationId}`;

    return (
        <div
            className={cn(
                "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
                className,
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary/5 px-4 py-2 border-b">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Train className="h-3.5 w-3.5" />
                    <span>{trip.routeName}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="font-mono text-primary">{trip.trainCode}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] h-5">
                    {trip.totalSeats} chỗ
                </Badge>
            </div>

            {/* Journey */}
            <div className="px-4 py-3 flex items-center gap-3">
                {/* Departure */}
                <div className="min-w-0 text-center">
                    <p className="text-lg font-bold tabular-nums leading-none">
                        {format(departure, "HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[80px]" title={trip.fromStation}>
                        {trip.fromStation}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                        {format(departure, "dd/MM", { locale: vi })}
                    </p>
                </div>

                {/* Duration */}
                <div className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground">{durationLabel}</span>
                    <div className="relative w-full flex items-center">
                        <div className="flex-1 h-px bg-border" />
                        <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 shrink-0" />
                        <div className="flex-1 h-px bg-border" />
                    </div>
                </div>

                {/* Arrival */}
                <div className="min-w-0 text-center">
                    <p className="text-lg font-bold tabular-nums leading-none">
                        {format(arrival, "HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[80px]" title={trip.toStation}>
                        {trip.toStation}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                        {format(arrival, "dd/MM", { locale: vi })}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-3">
                <Button asChild size="sm" className="w-full h-8 gap-1.5 text-xs">
                    <Link href={bookingUrl}>
                        <TicketCheck className="h-3.5 w-3.5" />
                        Đặt vé ngay
                    </Link>
                </Button>
            </div>
        </div>
    );
}
