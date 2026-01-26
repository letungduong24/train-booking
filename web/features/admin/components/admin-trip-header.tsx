import { Badge } from "@/components/ui/badge";
import { TripDetail } from "@/lib/schemas/trip.schema";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Train, MapPin, Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatsCards } from "./stats-cards";
import { getTripStatusInfo } from "@/lib/trip-status";

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


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {trip.train?.code}-{format(new Date(trip.departureTime), 'yyyyMMdd')}
                        </h1>
                        {(() => {
                            const { label, colorClass, icon: StatusIcon } = getTripStatusInfo(trip.status);
                            return (
                                <Badge className={`${colorClass} px-3 py-1 text-base border-none`}>
                                    {StatusIcon && <StatusIcon className="w-4 h-4 mr-1" />}
                                    {label}
                                </Badge>
                            );
                        })()}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                        <Train className="w-4 h-4" />
                        <span>{trip.train?.name}</span>
                        <span className="mx-2">•</span>
                        <MapPin className="w-4 h-4" />
                        <span>{trip.route?.name}</span>
                        <span className="mx-2">•</span>
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(trip.departureTime), 'HH:mm dd/MM/yyyy', { locale: vi })}</span>
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
