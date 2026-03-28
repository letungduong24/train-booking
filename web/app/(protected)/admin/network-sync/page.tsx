"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { Loader2, Upload, Map as MapIcon, RefreshCw, TrainTrack, Database, FileLineChart } from "lucide-react";
import { Map, MapLineLayer, MapMarker, MarkerLabel, MarkerContent, MapControls, MarkerTooltip } from "@/components/ui/map";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

interface NetworkLine {
    id: string;
    name: string;
    pathCoordinates: number[][][]; // GeoJSON MultiLineString coordinates
}

interface Station {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

export default function NetworkSyncPage() {
    const [mapFile, setMapFile] = useState<File | null>(null);
    const [jsonFile, setJsonFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [geoJsonDialogOpen, setGeoJsonDialogOpen] = useState(false);
    const [jsonDataDialogOpen, setJsonDataDialogOpen] = useState(false);

    const [network, setNetwork] = useState<{ stations: Station[], lines: NetworkLine[] } | null>(null);
    const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);

    const fetchNetwork = async () => {
        setIsLoadingNetwork(true);
        try {
            const response = await apiClient.get('/geojson/network');
            setNetwork(response.data.data);
        } catch (error) {
            console.error("Failed to load network:", error);
            toast.error("Không thể tải dữ liệu mạng lưới");
        } finally {
            setIsLoadingNetwork(false);
        }
    };

    useEffect(() => {
        fetchNetwork();
    }, []);

    const networkLinesGeoJson = useMemo(() => {
        if (!network?.lines || network.lines.length === 0) return null;

        const features: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>[] = [];
        network.lines.forEach((line) => {
            line.pathCoordinates.forEach((coords: any) => {
                features.push({
                    type: "Feature",
                    properties: { id: line.id, name: line.name },
                    geometry: {
                        type: Array.isArray(coords[0]) && Array.isArray(coords[0][0]) ? "MultiLineString" : "LineString",
                        coordinates: coords
                    }
                });
            });
        });

        return {
            type: "FeatureCollection",
            features
        } as GeoJSON.FeatureCollection<GeoJSON.LineString | GeoJSON.MultiLineString>;
    }, [network?.lines]);

    const handleSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mapFile) {
            toast.error("Vui lòng chọn file GeoJSON chứa bản đồ mạng lưới (map.geojson)");
            return;
        }

        setIsLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("mapData", mapFile);

        try {
            const response = await apiClient.post("/geojson/sync", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setResult(response.data.data);
            toast.success("Đã xóa mạng lưới cũ và đồng bộ mạng lưới hiện tại thành công.");
            setGeoJsonDialogOpen(false);
            setMapFile(null);
            fetchNetwork(); // Refresh the map
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi đồng bộ.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJsonUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jsonFile) {
            toast.error("Vui lòng chọn file JSON dữ liệu");
            return;
        }
        // Placeholder for JSON logic if needed
        toast.info("Tính năng tải lên JSON đang được hoàn thiện");
        setJsonDataDialogOpen(false);
    }

    return (
        <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Đồng bộ Mạng lưới</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Quản lý cơ sở hạ tầng đường sắt và dữ liệu bản đồ lõi</p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={geoJsonDialogOpen} onOpenChange={setGeoJsonDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#802222] hover:bg-rose-900 border-none rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20 px-6 transition-all active:scale-95">
                                <Upload className="mr-2 h-4 w-4" /> Tải lên GEOJSON
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-none bg-white dark:bg-zinc-950 p-6 [&>button:last-child]:hidden">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Cập nhật mạng lưới (GEOJSON)</DialogTitle>
                                <DialogDescription className="text-sm font-medium text-muted-foreground/50">
                                    Thao tác này sẽ xóa toàn bộ hệ thống cũ để thay thế bằng dữ liệu mới.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSync} className="space-y-6 mt-4">
                                <div className="space-y-3">
                                    <Label htmlFor="mapData" className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">File Bản đồ (.geojson)</Label>
                                    <Input
                                        id="mapData"
                                        type="file"
                                        accept=".geojson,application/json"
                                        onChange={(e) => setMapFile(e.target.files?.[0] || null)}
                                        className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 text-lg transition-all flex items-center px-4 pt-3.5"
                                    />
                                </div>
                                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                    <p className="text-xs text-red-600 dark:text-red-400 font-bold leading-tight">
                                        ⚠️ Cảnh báo: Toàn bộ dữ liệu trạm và đường ray lõi hiện tại sẽ bị xóa sạch và không thể khôi phục.
                                    </p>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isLoading || !mapFile} className="w-full h-14 rounded-2xl bg-[#802222] text-white hover:bg-rose-900 border-none shadow-2xl shadow-rose-900/30 transition-all font-bold text-lg">
                                        {isLoading ? <Loader2 className="animate-spin" /> : "Xác nhận đồng bộ"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Horizontal Network Metrics Bar */}
            <div className="rounded-[2.5rem] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] p-6 relative group">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-center lg:justify-between gap-8 px-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-[#802222] dark:text-rose-400">
                            <MapIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-[#802222] dark:text-rose-400 tracking-tight leading-none">Thống kê Mạng lưới</h4>
                            <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest mt-1">Cơ sở hạ tầng đường sắt hiện tại</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-16 flex-1 lg:justify-end">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Ga tàu hiện có</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#802222] tabular-nums tracking-tighter">
                                    {network?.stations?.length || 0}
                                </span>
                                <span className="text-xs font-bold text-[#802222]/40 tracking-tighter uppercase">nhà ga</span>
                            </div>
                        </div>

                        <div className="space-y-0.5 lg:border-l lg:border-gray-50 lg:dark:border-zinc-800/50 lg:pl-16">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Đường ray kết nối</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#802222] tabular-nums tracking-tighter">
                                    {network?.lines?.length || 0}
                                </span>
                                <span className="text-xs font-bold text-[#802222]/40 tracking-tighter uppercase">nhánh</span>
                            </div>
                        </div>
                    </div>
                </div>

                {result && (
                    <div className="mt-6 mx-4 p-4 rounded-[1.5rem] bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 animate-in zoom-in-95 duration-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Database className="h-4 w-4 text-emerald-600" />
                            <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed capitalize">
                                <span className="font-bold">Đồng bộ thành công:</span> Đã áp dụng {result.stationsProcessed} ga và {result.networkLinesProcessed} nhánh đường sắt mới vào hệ thống lõi.
                            </p>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600/50 uppercase">vừa xong</span>
                    </div>
                )}
            </div>

            {/* Full-width Map Card */}
            <Card className="flex flex-col rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015] bg-white dark:bg-zinc-950 overflow-hidden relative group min-h-[600px]">
                <CardContent className="flex-1 p-0 relative">
                    {isLoadingNetwork && !network ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-rose-50/5 z-20">
                            <Loader2 className="h-8 w-8 animate-spin text-[#802222]/40" />
                        </div>
                    ) : (
                        <div className="w-full h-full min-h-[600px] relative">
                            <Map
                                center={[105.8542, 21.0285]}
                                zoom={5.5}
                                styles={{ light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" }}
                                interactive={true}
                            >
                                <MapControls position="top-right" />

                                {networkLinesGeoJson && (
                                    <MapLineLayer
                                        id="network-core-lines"
                                        data={networkLinesGeoJson}
                                        color="#802222"
                                        width={2.5}
                                        opacity={0.8}
                                    />
                                )}

                                {network?.stations?.map((station) => (
                                    <MapMarker
                                        key={station.id}
                                        latitude={station.latitude}
                                        longitude={station.longitude}
                                    >
                                        <MarkerContent className="group cursor-pointer">
                                            <div className="relative h-2.5 w-2.5 rounded-full border border-white bg-[#802222] shadow-sm group-hover:scale-[1.4] transition-all duration-300" />
                                        </MarkerContent>
                                        <MarkerTooltip className="text-[10px] font-bold bg-[#802222] text-white px-2 py-1 rounded-lg shadow-none border-none z-50">
                                            {station.name}
                                        </MarkerTooltip>
                                    </MapMarker>
                                ))}
                            </Map>

                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
