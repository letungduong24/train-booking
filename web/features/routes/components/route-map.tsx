"use client"

import React, { useMemo } from 'react'
import { Plus, Train } from 'lucide-react'
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
    availableStations?: {
        id: string;
        name: string;
        latitude: number;
        longitude: number;
    }[]
    onAddStationClick?: (station: { id: string; name: string; latitude: number; longitude: number }) => void;
    trainLocation?: {
        latitude: number;
        longitude: number;
        bearing: number;
        speed: number;
        progress: number;
        status: string;
    } | null;
}

export function RouteMap({
    stations,
    className,
    highlightSegment,
    pathCoordinates,
    selectedFromStationId,
    selectedToStationId,
    onStationClick,
    availableStations,
    onAddStationClick,
    trainLocation,
}: RouteMapProps) {
    // Filter valid stations first
    const validStations = stations.filter(s => s.station && s.station.longitude && s.station.latitude);

    // Compute available candidate stations not yet in the route
    const existingStationIds = new Set(stations.map(s => s.stationId));
    const candidateStations = (availableStations || []).filter(s => !existingStationIds.has(s.id) && s.latitude && s.longitude);

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
    let center = validStations.length > 0 ? [validStations[0].station!.longitude, validStations[0].station!.latitude] as [number, number] : [105.8542, 21.0285] as [number, number];
    if (trainLocation) {
        center = [trainLocation.longitude, trainLocation.latitude];
    } else if (highlightCoordinates.length > 0) {
        const midIndex = Math.floor(highlightCoordinates.length / 2);
        center = highlightCoordinates[midIndex];
    }

    return (
        <div className={`w-full rounded-md border overflow-hidden ${className || 'h-[500px]'}`}>
            <Map
                center={center}
                zoom={trainLocation ? 10 : (highlightCoordinates.length > 0 ? 9 : 8)}
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

                {/* Render simulated train live location */}
                {trainLocation && (
                    <MapMarker
                        key="train-live-marker"
                        longitude={trainLocation.longitude}
                        latitude={trainLocation.latitude}
                        rotation={trainLocation.bearing}
                        rotationAlignment="map"
                    >
                        <MarkerContent className="z-30">
                            <div className="relative flex items-center justify-center size-10">
                                {/* Directional arrow pointing UP (North) at the top of marker */}
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-rose-500 z-10 filter drop-shadow-md" />
                                
                                {/* Pulsing radar rings */}
                                <div className="absolute inset-0 rounded-full bg-rose-500/35 animate-ping" />
                                <div className="absolute size-8 rounded-full border border-rose-500/40" />

                                {/* Train center badge */}
                                <div className="relative size-8 rounded-full bg-rose-700 hover:bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white transition-all">
                                    <Train className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </MarkerContent>
                        <MarkerTooltip>
                            Tàu đang chạy • {trainLocation.speed} km/h (Tiến độ {Math.round(trainLocation.progress * 100)}%)
                        </MarkerTooltip>
                    </MapMarker>
                )}

                {/* Render candidate network stations available to add */}
                {candidateStations.map((candidate) => (
                    <MapMarker
                        key={`candidate-${candidate.id}`}
                        longitude={candidate.longitude}
                        latitude={candidate.latitude}
                        onClick={() => onAddStationClick?.(candidate)}
                    >
                        <MarkerContent>
                            <div className="size-5 rounded-full border border-white shadow-md bg-zinc-400/80 hover:bg-[#802222] hover:scale-150 flex items-center justify-center text-white transition-all cursor-pointer z-20 group">
                                <Plus className="w-3 h-3 opacity-80 group-hover:opacity-100" />
                            </div>
                        </MarkerContent>
                        <MarkerTooltip>{candidate.name} (Nhấn để thêm)</MarkerTooltip>
                    </MapMarker>
                ))}
            </Map>
        </div>
    )
}
