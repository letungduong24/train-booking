"use client"

import React, { useMemo } from 'react'
import {
    Map,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
    MapLineLayer,
} from "@/components/ui/map"
import { Station } from '@/lib/schemas/station.schema';

interface RouteMapProps {
    stations: {
        stationId: string;
        index: number;
        station?: {
            id: string;
            name: string;
            latitude: number;
            longitude: number;
        } | null;
    }[]
    className?: string;
    highlightSegment?: {
        fromStationId: string;
        toStationId: string;
    }
    pathCoordinates?: [number, number][][] | null;
    selectedFromStationId?: string;
    selectedToStationId?: string;
    onStationClick?: (stationId: string) => void;
}

export function RouteMap({
    stations,
    className,
    highlightSegment,
    pathCoordinates,
    selectedFromStationId,
    selectedToStationId,
    onStationClick,
}: RouteMapProps) {
    // Filter valid stations first
    const validStations = stations.filter(s => s.station && s.station.longitude && s.station.latitude);

    // If no data, show placeholder
    if (validStations.length === 0) {
        return (
            <div className={`w-full bg-muted/20 flex items-center justify-center rounded-md border ${className || 'h-[400px]'}`}>
                <p className="text-muted-foreground">Chưa có dữ liệu bản đồ</p>
            </div>
        )
    }

    // Build GeoJSON from pathCoordinates (number[][][]) — each sub-array is a LineString segment
    const pathGeoJson = useMemo(() => {
        if (!pathCoordinates || pathCoordinates.length === 0) return null;
        return {
            type: "FeatureCollection" as const,
            features: [{
                type: "Feature" as const,
                properties: {},
                geometry: {
                    type: "MultiLineString" as const,
                    coordinates: pathCoordinates
                }
            }]
        } as GeoJSON.FeatureCollection<GeoJSON.MultiLineString>;
    }, [pathCoordinates]);

    // Fallback: straight line between stations when no path data
    const fallbackGeoJson = useMemo(() => {
        const coords = validStations.map(s => [s.station!.longitude, s.station!.latitude]);
        if (coords.length < 2) return null;
        return {
            type: "FeatureCollection" as const,
            features: [{
                type: "Feature" as const,
                properties: {},
                geometry: { type: "LineString" as const, coordinates: coords }
            }]
        } as GeoJSON.FeatureCollection<GeoJSON.LineString>;
    }, [validStations]);

    // Calculate highlighted segment coordinates ONLY for centering map
    let highlightCoordinates: [number, number][] = [];
    if (highlightSegment) {
        const fromIndex = validStations.findIndex(s => s.stationId === highlightSegment.fromStationId);
        const toIndex = validStations.findIndex(s => s.stationId === highlightSegment.toStationId);

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex <= toIndex) {
            highlightCoordinates = validStations
                .slice(fromIndex, toIndex + 1)
                .map(s => [s.station!.longitude, s.station!.latitude] as [number, number]);
        }
    }

    // Use first station as center or calculating center of highlighted segment
    let center = [validStations[0].station!.longitude, validStations[0].station!.latitude] as [number, number];
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
                {/* Route path — follows railway tracks if pathCoordinates available */}
                {pathGeoJson ? (
                    <MapLineLayer
                        id="route-path"
                        data={pathGeoJson}
                        color="#802222"
                        width={4}
                        opacity={0.8}
                    />
                ) : fallbackGeoJson ? (
                    <MapLineLayer
                        id="route-path-fallback"
                        data={fallbackGeoJson as any}
                        color="#802222"
                        width={3}
                        opacity={0.5}
                    />
                ) : null}

                {/* NO HIGHLIGHTED ROUTE LINE to avoid color crashes */}

                {validStations.map((item, index) => {
                    const isHighlighted = highlightSegment
                        ? (item.stationId === highlightSegment.fromStationId || item.stationId === highlightSegment.toStationId)
                        : false;
                    const isSelectedFrom = item.stationId === selectedFromStationId;
                    const isSelectedTo = item.stationId === selectedToStationId;

                    const isActive = isSelectedFrom || isSelectedTo || isHighlighted;

                    return (
                        <MapMarker
                            key={`${item.stationId}`}
                            longitude={item.station!.longitude}
                            latitude={item.station!.latitude}
                            onClick={() => onStationClick?.(item.stationId)}
                        >
                            <MarkerContent>
                                <div className={`size-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-black transition-all ${isActive ? 'bg-[#802222] scale-125 z-10' : 'bg-rose-900/40'} ${onStationClick ? 'cursor-pointer hover:scale-150' : ''}`}>
                                    {isSelectedFrom ? (
                                        'A'
                                    ) : isSelectedTo ? (
                                        'B'
                                    ) : isHighlighted ? (
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
