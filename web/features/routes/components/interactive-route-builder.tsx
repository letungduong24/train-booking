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
        return <Skeleton className="w-full h-[400px] rounded-[1.5rem]" />
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative w-full h-[400px] rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm">
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
                            color="#802222" // Rose primary
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
                                        ? "h-6 w-6 border-white bg-[#802222] z-50 scale-125 shadow-lg shadow-rose-900/40"
                                        : "h-3 w-3 border-white bg-slate-300 hover:bg-rose-400 hover:scale-150"
                                        }`}>
                                        {isSelected && (
                                            <span className="text-[10px] font-black text-white">{selectionIndex + 1}</span>
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
            <div className="p-6 bg-gray-50/20 dark:bg-zinc-900/20 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 space-y-4 min-h-[80px]">
                <div className="flex items-center gap-3 text-[#802222] dark:text-rose-400 font-bold tracking-wider opacity-80">
                    <IconMapPin className="w-4 h-4" />
                    Lộ trình đã chọn ({value.length} trạm)
                </div>
                {value.length === 0 ? (
                    <span className="text-sm text-muted-foreground/60 italic ml-6">Vui lòng chọn các ga trên bản đồ theo thứ tự tuyến đường</span>
                ) : (
                    <div className="flex flex-wrap gap-2 mt-2 ml-1">
                        {value.map((station, index) => (
                            <div key={station.id} className="flex items-center">
                                <Badge variant="secondary" className="pl-1 pr-2 py-1 flex items-center gap-2 bg-white border border-rose-100 text-zinc-800 rounded-xl shadow-sm hover:border-rose-200 transition-colors">
                                    <div className="flex bg-[#802222] text-white rounded-lg w-5 h-5 items-center justify-center text-[10px] font-black">
                                        {index + 1}
                                    </div>
                                    <span className="font-semibold">{station.name}</span>
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
                <div className="flex pt-2">
                    <Button variant="ghost" size="sm" onClick={() => onChange?.([])} className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-10 font-bold border border-rose-100/50 transition-all">
                        Xóa toàn bộ lộ trình hiện có
                    </Button>
                </div>
            )}
        </div>
    )
}
