"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { Loader2, Upload, Map as MapIcon, RefreshCw, TrainTrack } from "lucide-react";
import { Map, MapLineLayer, MapMarker, MarkerLabel, MarkerContent, MapControls, MarkerTooltip } from "@/components/ui/map";
import { Skeleton } from "@/components/ui/skeleton";

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
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

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
            fetchNetwork(); // Refresh the map
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi đồng bộ.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 h-[calc(100vh-4rem)] gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Đồng bộ Mạng lưới (Network Sync)</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 flex-1 min-h-0">
                <Card className="col-span-4 flex flex-col overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">Bản đồ Mạng lưới Lõi</CardTitle>
                            <CardDescription>
                                {network?.stations?.length || 0} Ga | {network?.lines?.length || 0} Nhánh đường sắt
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchNetwork} disabled={isLoadingNetwork}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNetwork ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 relative min-h-[400px]">
                        {isLoadingNetwork && !network ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="w-full h-full min-h-[500px]">
                                <Map
                                    center={[105.8542, 21.0285]}
                                    zoom={5}
                                    styles={{ light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" }}
                                    interactive={true}
                                >
                                    <MapControls position="top-right" />

                                    {networkLinesGeoJson && (
                                        <MapLineLayer
                                            id="network-core-lines"
                                            data={networkLinesGeoJson}
                                            color="#475569" // slate-600
                                            width={3}
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
                                                <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
                                            </MarkerContent>
                                            <MarkerTooltip className="text-sm font-bold bg-slate-800 text-white px-2 py-1 rounded shadow-lg border-none whitespace-nowrap z-50">
                                                {station.name}
                                            </MarkerTooltip>
                                        </MapMarker>
                                    ))}
                                </Map>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="col-span-3 space-y-4 flex flex-col overflow-y-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tải lên dữ liệu GeoJSON</CardTitle>
                            <CardDescription>
                                Tải lên file <strong>map.geojson</strong> chứa toàn bộ ga tàu và đường ray để ghi đè mạng lưới đường sắt lõi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSync} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="mapData">File Bản đồ (map.geojson)</Label>
                                    <Input
                                        id="mapData"
                                        type="file"
                                        accept=".geojson,application/json"
                                        onChange={(e) => setMapFile(e.target.files?.[0] || null)}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2 text-red-500 font-medium">Lưu ý: Thao tác này sẽ xóa toàn bộ hệ thống ga và mạng lưới đường ray hiện tại để cập nhật thông tin mới nhất.</p>
                                </div>

                                <Button type="submit" disabled={isLoading || !mapFile} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang đồng bộ...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Bắt đầu đồng bộ
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {result && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Kết quả đồng bộ</CardTitle>
                                <CardDescription>
                                    Thống kê dữ liệu đã được nạp vào cơ sở dữ liệu.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium text-muted-foreground">Ga tàu đã xuất lên:</span>
                                        <span className="text-xl font-bold">{result.stationsProcessed || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b">
                                        <span className="font-medium text-muted-foreground">Đoạn đường ray xử lý:</span>
                                        <span className="text-xl font-bold">{result.networkLinesProcessed || 0}</span>
                                    </div>
                                    <div className="mt-4 p-4 bg-muted rounded-md text-sm text-muted-foreground">
                                        <p>Mạng lưới đường sắt vật lý đã sẵn sàng. Bạn có thể sử dụng màn hình Tạo Tuyến Đường để thiết lập các chuyến tàu hoạt động trên mạng lưới này.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
