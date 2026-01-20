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
    name: z.string().min(1, "Required"),
    status: z.string(),
    durationMinutes: z.number().default(0),
    turnaroundMinutes: z.number().default(60),
    basePricePerKm: z.number().default(1000),
    stationFee: z.number().default(0),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
    stations: z.array(routeStationSchema).optional(),
});

export const createRouteSchema = routeSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    stations: true,
}).extend({
    status: z.string().optional(), // Make status optional since backend sets default
    durationMinutes: z.number(),
    turnaroundMinutes: z.number(),
    basePricePerKm: z.number().default(1000),
    stationFee: z.number().default(0),
});

export const updateRouteSchema = createRouteSchema.partial();

// Schema for updating route station details
export const updateRouteStationSchema = z.object({
    name: z.string().min(1, "Tên trạm không được để trống"),
    latitute: z.number(),
    longtitute: z.number(),
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
