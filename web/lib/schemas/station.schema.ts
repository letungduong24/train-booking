import { z } from "zod";

export const stationSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Bắt buộc"),
    latitute: z.number(),
    longtitute: z.number(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
});

export const createStationSchema = stationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateStationSchema = createStationSchema.partial();

export type Station = z.infer<typeof stationSchema>;
export type CreateStationInput = z.infer<typeof createStationSchema>;
export type UpdateStationInput = z.infer<typeof updateStationSchema>;

export type StationFilters = {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export type StationsResponse = {
    data: Station[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}
