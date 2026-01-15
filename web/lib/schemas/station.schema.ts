import { z } from 'zod';

export const stationSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, { message: 'Tên trạm không được để trống' }),
    latitute: z.number(),
    longtitute: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Station = z.infer<typeof stationSchema>;

export const createStationSchema = stationSchema.pick({
    name: true,
    latitute: true,
    longtitute: true,
});

export type CreateStationInput = z.infer<typeof createStationSchema>;

export const updateStationSchema = stationSchema.pick({
    name: true,
    latitute: true,
    longtitute: true,
}).partial();

export type UpdateStationInput = z.infer<typeof updateStationSchema>;
