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
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
    stations: z.array(routeStationSchema).optional(),
});

export type Route = z.infer<typeof routeSchema>;
export type RouteStation = z.infer<typeof routeStationSchema>;
