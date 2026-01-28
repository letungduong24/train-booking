'use client';

import { Calendar, Clock, MapPin, Ticket, Train } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Booking } from '@/features/booking/hooks/use-my-bookings';

interface DashboardTripCardProps {
    booking: Booking;
}

export function DashboardTripCard({ booking }: DashboardTripCardProps) {
    const router = useRouter();

    return (
        <div
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/dashboard/history/${booking.code}`)}
        >
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold text-sm">{booking.trip.route.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{booking.code}</span>
                </div>
                <div className="flex gap-3 items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Train className="h-3 w-3" />
                        <span>Tàu {booking.trip.train.code}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(booking.trip.departureTime), 'dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(booking.trip.departureTime), 'HH:mm', { locale: vi })}</span>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
