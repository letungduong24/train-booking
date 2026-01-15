
import { z } from 'zod';

export const routeSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, { message: 'Tên tuyến đường không được để trống' }),
    status: z.string().default('active'),
    createdAt: z.date(),
    updatedAt: z.date(),
    stations: z.array(z.any()).optional(),
});

export type Route = z.infer<typeof routeSchema>;

export const createRouteSchema = routeSchema.pick({
    name: true,
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = routeSchema.pick({
    name: true,
    status: true,
}).partial();
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
