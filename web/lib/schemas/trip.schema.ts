import { z } from "zod";

// API Schemas
export const tripSchema = z.object({
    id: z.string(),
    routeId: z.string(),
    trainId: z.string(),
    departureTime: z.string(),
    endTime: z.string(),
    status: z.string(),
    route: z.object({
        id: z.string(),
        name: z.string(),
    }).optional(),
    train: z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
    }).optional(),
    _count: z.object({
        tickets: z.number(),
    }).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

// Create/Update Input Schemas
export const createTripSchema = z.object({
    routeId: z.string().min(1, "Route không được để trống"),
    trainId: z.string().min(1, "Train không được để trống"),
    departureTime: z.string().min(1, "Thời gian khởi hành không được để trống"),
});

export const updateTripSchema = createTripSchema.partial();

// Inferred Types
export type Trip = z.infer<typeof tripSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

// Detailed Schema for Booking
export const tripDetailSchema = tripSchema.extend({
    route: z.object({
        id: z.string(),
        name: z.string(),
        stations: z.array(z.object({
            id: z.string(),
            stationId: z.string(),
            station: z.object({
                id: z.string(),
                name: z.string(),
            }),
            distanceFromStart: z.number(),
        })),
    }),
    train: z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        coaches: z.array(z.object({
            id: z.string(),
            name: z.string(),
            order: z.number(),
            template: z.object({
                name: z.string(),
            }),
            _count: z.object({
                seats: z.number(),
            }).optional(),
        })),
    }),
});

export type TripDetail = z.infer<typeof tripDetailSchema>;

export type TripFilters = {
    page: number;
    limit: number;
    search?: string;
    routeId?: string;
    trainId?: string;
    departureTime?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export type TripsResponse = {
    data: Trip[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}
