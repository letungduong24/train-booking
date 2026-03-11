"use client"

import React, { useMemo, useState } from "react"
import { Map, MapLineLayer, MapMarker, MarkerTooltip, MarkerContent, MapControls } from "@/components/ui/map"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { IconMapPin, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export interface Station {
    id: string
    name: string
    latitude: number
    longitude: number
}

interface InteractiveRouteBuilderProps {
    value?: Station[]
    onChange?: (stations: Station[]) => void
}

export function InteractiveRouteBuilder({ value = [], onChange }: InteractiveRouteBuilderProps) {
    // 1. Fetch all stations
    const { data: stations = [], isLoading } = useQuery({
        queryKey: ["all-stations-map"],
        queryFn: async () => {
            const response = await apiClient.get('/station?all=true')
            return response.data.data as Station[]
        }
    })

    // 2. Fetch network lines (for visual context)
    const { data: networkLines = [] } = useQuery({
        queryKey: ["network-lines"],
        queryFn: async () => {
            const response = await apiClient.get('/geojson/network')
            return response.data.data.lines
        }
    })

    const networkLinesGeoJson = useMemo(() => {
        if (!networkLines || networkLines.length === 0) return null

        const features: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>[] = []
        networkLines.forEach((line: any) => {
            line.pathCoordinates.forEach((coords: any) => {
                features.push({
                    type: "Feature" as const,
                    properties: { id: line.id, name: line.name },
                    geometry: {
                        type: (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) ? "MultiLineString" as const : "LineString" as const,
                        coordinates: coords
                    } as GeoJSON.LineString | GeoJSON.MultiLineString
                })
            })
        })

        return {
            type: "FeatureCollection" as const,
            features
        } as GeoJSON.FeatureCollection<GeoJSON.LineString | GeoJSON.MultiLineString>
    }, [networkLines])

    // Toggle station selection
    const handleStationClick = (station: Station) => {
        // If already selected, remove it and all subsequent (or just remove it if it's the end? let's just do a toggle for now, keeping order)
        const isSelected = value.find(s => s.id === station.id)
        if (isSelected) {
            onChange?.(value.filter(s => s.id !== station.id))
        } else {
            onChange?.([...value, station])
        }
    }

    // Straight-line segments to preview the current path visually
    const currentPathGeoJson = useMemo(() => {
        if (value.length < 2) return null;

        const coordinates = value.map(s => [s.longitude, s.latitude]);
        return {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates
                    }
                }
            ]
        } as GeoJSON.FeatureCollection<GeoJSON.LineString>;
    }, [value])


    if (isLoading) {
        return <Skeleton className="w-full h-[400px] rounded-md" />
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative w-full h-[500px] rounded-md overflow-hidden border">
                <Map
                    center={[105.8542, 21.0285]}
                    zoom={5}
                    interactive={true}
                >
                    <MapControls position="top-right" />

                    {/* Render physical network underneath as faint lines */}
                    {networkLinesGeoJson && (
                        <MapLineLayer
                            id="network-core-lines"
                            data={networkLinesGeoJson}
                            color="#475569" // slate-600
                            width={3}
                            opacity={0.8}
                        />
                    )}

                    {/* Render actual route preview lines */}
                    {currentPathGeoJson && (
                        <MapLineLayer
                            id="route-preview-lines"
                            data={currentPathGeoJson}
                            color="#3b82f6" // blue-500
                            width={4}
                            opacity={1}
                        />
                    )}

                    {/* Render all stations */}
                    {stations.map((station) => {
                        const selectionIndex = value.findIndex(s => s.id === station.id)
                        const isSelected = selectionIndex !== -1

                        return (
                            <MapMarker
                                key={station.id}
                                latitude={station.latitude}
                                longitude={station.longitude}
                            >
                                <MarkerContent className="group cursor-pointer" onClick={() => handleStationClick(station)}>
                                    <div className={`relative flex items-center justify-center rounded-full border-2 shadow-sm transition-all ${isSelected
                                        ? "h-6 w-6 border-white bg-blue-600 z-50 scale-125"
                                        : "h-3 w-3 border-white bg-slate-400 hover:bg-slate-600 hover:scale-150"
                                        }`}>
                                        {isSelected && (
                                            <span className="text-[10px] font-bold text-white">{selectionIndex + 1}</span>
                                        )}
                                    </div>
                                </MarkerContent>
                                <MarkerTooltip className="text-sm font-bold bg-slate-800 text-white px-2 py-1 rounded shadow-lg border-none whitespace-nowrap z-50">
                                    {station.name} {isSelected && `(Trạm ${selectionIndex + 1})`}
                                </MarkerTooltip>
                            </MapMarker>
                        )
                    })}
                </Map>
            </div>

            {/* Selected Route summary */}
            <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-md border min-h-[80px]">
                <span className="text-sm font-semibold flex items-center text-muted-foreground">
                    <IconMapPin className="w-4 h-4 mr-1" />
                    Lộ trình đã chọn ({value.length} trạm)
                </span>
                {value.length === 0 ? (
                    <span className="text-sm text-muted-foreground italic">Vui lòng chọn các ga trên bản đồ theo thứ tự tuyến đường</span>
                ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {value.map((station, index) => (
                            <div key={station.id} className="flex items-center">
                                <Badge variant="secondary" className="pl-1 pr-2 py-1 flex items-center gap-1 bg-white border border-blue-200">
                                    <div className="flex bg-blue-500 text-white rounded-full w-5 h-5 items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    {station.name}
                                    <button
                                        type="button"
                                        onClick={() => handleStationClick(station)}
                                        className="ml-1 text-slate-400 hover:text-red-500"
                                    >
                                        <IconX className="w-3 h-3" />
                                    </button>
                                </Badge>
                                {index < value.length - 1 && (
                                    <span className="text-muted-foreground mx-1">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {value.length > 0 && (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => onChange?.([])} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Xóa toàn bộ lộ trình
                    </Button>
                </div>
            )}
        </div>
    )
}
