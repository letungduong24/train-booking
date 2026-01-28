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
        station?: {
            id: string;
            name: string;
            latitute: number;
            longtitute: number;
        } | null;
    }[]
    className?: string;
    highlightSegment?: {
        fromStationId: string;
        toStationId: string;
    }
}

export function RouteMap({ stations, className, highlightSegment }: RouteMapProps) {
    // Filter valid stations first
    const validStations = stations.filter(s => s.station && s.station.longtitute && s.station.latitute);

    // If no data, show placeholder
    if (validStations.length === 0) {
        return (
            <div className={`w-full bg-muted/20 flex items-center justify-center rounded-md border ${className || 'h-[400px]'}`}>
                <p className="text-muted-foreground">Chưa có dữ liệu bản đồ</p>
            </div>
        )
    }

    // Prepare coordinates for polyline
    const routeCoordinates = validStations.map(s => [s.station!.longtitute, s.station!.latitute] as [number, number]);

    // Calculate highlighted segment coordinates ONLY for centering map
    let highlightCoordinates: [number, number][] = [];
    if (highlightSegment) {
        const fromIndex = validStations.findIndex(s => s.stationId === highlightSegment.fromStationId);
        const toIndex = validStations.findIndex(s => s.stationId === highlightSegment.toStationId);

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex <= toIndex) {
            highlightCoordinates = validStations
                .slice(fromIndex, toIndex + 1)
                .map(s => [s.station!.longtitute, s.station!.latitute] as [number, number]);
        }
    }

    // Use first station as center or calculating center of highlighted segment
    let center = [validStations[0].station!.longtitute, validStations[0].station!.latitute] as [number, number];
    if (highlightCoordinates.length > 0) {
        const midIndex = Math.floor(highlightCoordinates.length / 2);
        center = highlightCoordinates[midIndex];
    }

    return (
        <div className={`w-full rounded-md border overflow-hidden ${className || 'h-[500px]'}`}>
            <Map
                center={center}
                zoom={highlightCoordinates.length > 0 ? 9 : 8}
            >
                {/* Full Route (Dimmed) */}
                <MapRoute
                    coordinates={routeCoordinates}
                    color="#94a3b8" // slate-400
                    width={4}
                    opacity={0.5}
                />

                {/* NO HIGHLIGHTED ROUTE LINE to avoid color crashes */}

                {validStations.map((item, index) => {
                    const isHighlighted = highlightSegment
                        ? (item.stationId === highlightSegment.fromStationId || item.stationId === highlightSegment.toStationId)
                        : false;

                    return (
                        <MapMarker
                            key={`${item.stationId}`}
                            longitude={item.station!.longtitute}
                            latitude={item.station!.latitute}
                        >
                            <MarkerContent>
                                <div className={`size-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-primary-foreground text-xs font-bold transition-all ${isHighlighted ? 'bg-primary scale-125 z-10' : 'bg-primary/80'
                                    }`}>
                                    {isHighlighted ? (
                                        item.stationId === highlightSegment?.fromStationId ? 'A' : 'B'
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                            </MarkerContent>
                            <MarkerTooltip>{item.station!.name}</MarkerTooltip>
                        </MapMarker>
                    )
                })}
            </Map>
        </div>
    )
}
