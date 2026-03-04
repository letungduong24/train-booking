"use client";

import { Train } from "lucide-react";
import { TripCard, type TripCardData } from "./trip-card";

interface TripSearchResultProps {
    trips: TripCardData[];
    date: string;
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

    return (
        <div className="flex flex-col gap-2 w-full">
            <p className="text-xs text-muted-foreground px-1">
                Tìm thấy <span className="font-semibold text-foreground">{trips.length}</span> chuyến tàu ngày {date}
            </p>
            {trips.map((trip) => (
                <TripCard key={trip.tripId} trip={trip} />
            ))}
        </div>
    );
}
