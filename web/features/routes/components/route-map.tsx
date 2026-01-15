"use client"

import React from 'react'
import {
    Map,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
    MapRoute,
} from "@/components/ui/map"
import { Station } from '@/lib/schemas/station.schema';

interface RouteMapProps {
    stations: {
        stationId: string;
        index: number;
        station?: Station;
    }[]
}

export function RouteMap({ stations }: RouteMapProps) {
    // Filter valid stations first
    const validStations = stations.filter(s => s.station && s.station.longtitute && s.station.latitute);

    // If no data, show placeholder
    if (validStations.length === 0) {
        return (
            <div className="h-[400px] w-full bg-muted/20 flex items-center justify-center rounded-md border">
                <p className="text-muted-foreground">Chưa có dữ liệu bản đồ</p>
            </div>
        )
    }

    // Prepare coordinates for polyline
    const routeCoordinates = validStations.map(s => [s.station!.longtitute, s.station!.latitute] as [number, number]);

    // Use first station as center
    const center = [validStations[0].station!.longtitute, validStations[0].station!.latitute] as [number, number];

    return (
        <div className="h-[500px] w-full rounded-md border overflow-hidden">
            <Map
                center={center}
                zoom={8}
            >
                <MapRoute
                    coordinates={routeCoordinates}
                    color="#3b82f6"
                    width={4}
                    opacity={0.8}
                />

                {validStations.map((item, index) => (
                    <MapMarker
                        key={`${item.stationId}`}
                        longitude={item.station!.longtitute}
                        latitude={item.station!.latitute}
                    >
                        <MarkerContent>
                            <div className="size-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                            </div>
                        </MarkerContent>
                        <MarkerTooltip>{item.station!.name}</MarkerTooltip>
                    </MapMarker>
                ))}
            </Map>
        </div>
    )
}
