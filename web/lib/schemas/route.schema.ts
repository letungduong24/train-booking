import { z } from "zod";
import { stationSchema } from "./station.schema";

export const routeStationSchema = z.object({
    routeId: z.string(),
    stationId: z.string(),
    index: z.number(),
    distanceFromStart: z.number(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
    station: stationSchema.optional(),
});

export const routeSchema = z.object({
    id: z.string(),
    code: z.string(),
    version: z.number().optional(),
    networkId: z.string().optional(),
    name: z.string().min(1, "Required"),
    status: z.string(),
    durationMinutes: z.number().default(0),
    turnaroundMinutes: z.number().default(60),
    totalDistanceKm: z.number().default(0),
    basePricePerKm: z.number().default(1000),
    stationFee: z.number().default(0),
    pathCoordinates: z.any().optional(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
    stations: z.array(routeStationSchema).optional(),
});

export const createRouteSchema = routeSchema.omit({
    id: true,
    version: true,
    createdAt: true,
    updatedAt: true,
    stations: true,
}).extend({
    code: z.string().min(1, "Mã tuyến không được để trống"),
    networkId: z.string().optional(),
    status: z.string().optional(),
    durationMinutes: z.number().min(1, "Thời gian chạy phải lớn hơn 0"),
    turnaroundMinutes: z.number().min(0, "Thời gian nghỉ không được âm"),
    totalDistanceKm: z.number().min(0.1, "Quãng đường phải lớn hơn 0"),
    basePricePerKm: z.number().min(1, "Giá cơ bản phải lớn hơn 0"),
    stationFee: z.number().min(0, "Phí bến không được âm"),
    stations: z.array(z.object({
        id: z.string(),
        name: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
    })).min(2, "Tuyến đường phải có ít nhất 2 ga dừng (Ga đi và Ga đến)"),
});

export const updateRouteSchema = createRouteSchema.partial();

// Schema for updating route station details
export const updateRouteStationSchema = z.object({
    name: z.string().min(1, "Tên trạm không được để trống"),
    latitude: z.number(),
    longitude: z.number(),
    distanceFromStart: z.number().min(0, "Khoảng cách phải lớn hơn hoặc bằng 0"),
});

export type Route = z.infer<typeof routeSchema>;
export type RouteStation = z.infer<typeof routeStationSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type UpdateRouteStationInput = z.infer<typeof updateRouteStationSchema>;

export type RouteFilters = {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export type RoutesResponse = {
    data: Route[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}
