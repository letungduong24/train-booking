"use client";

import { Train } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { TripCard, type TripCardData } from "./trip-card";

interface TripSearchResultProps {
    trips: TripCardData[];
    date: string; // YYYY-MM-DD — ngày người dùng yêu cầu
}

export function TripSearchResult({ trips, date }: TripSearchResultProps) {
    if (trips.length === 0) {
        return (
            <div className="rounded-xl border bg-muted/40 p-4 flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-muted p-3">
                    <Train className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <div>
                    <p className="text-sm font-medium">Không tìm thấy chuyến tàu</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Ngày {date} không có chuyến phù hợp.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Thử hỏi tôi với ngày khác nhé!
                    </p>
                </div>
            </div>
        );
    }

    // Tách chuyến đúng ngày vs chuyến gần nhất
    const exactTrips = trips.filter(t => t.departureTime.startsWith(date));
    const nearbyTrips = trips.filter(t => !t.departureTime.startsWith(date));
    const hasExact = exactTrips.length > 0;
    const requestedDateLabel = format(new Date(date), "dd/MM/yyyy", { locale: vi });

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Chuyến đúng ngày */}
            {hasExact && (
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground px-1">
                        Tìm thấy <span className="font-semibold text-foreground">{exactTrips.length}</span> chuyến tàu ngày {requestedDateLabel}
                    </p>
                    {exactTrips.map((trip) => (
                        <TripCard key={trip.tripId} trip={trip} />
                    ))}
                </div>
            )}

            {/* Chuyến gần nhất (khác ngày) */}
            {nearbyTrips.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground px-1">
                        {!hasExact
                            ? <>Không có chuyến nào vào ngày <span className="font-semibold text-foreground">{requestedDateLabel}</span>. Bạn có thể tham khảo các chuyến gần nhất:</>
                            : <span className="italic">Một số chuyến tàu gần ngày {requestedDateLabel}:</span>
                        }
                    </p>
                    {nearbyTrips.map((trip) => (
                        <TripCard key={trip.tripId} trip={trip} />
                    ))}
                </div>
            )}
        </div>
    );
}
