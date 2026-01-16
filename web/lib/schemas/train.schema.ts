import { z } from "zod";

export const trainSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createTrainSchema = z.object({
    code: z.string().min(1, "Mã tàu không được để trống"),
    name: z.string().min(1, "Tên tàu không được để trống"),
    status: z.string().optional(),
})

export const updateTrainSchema = createTrainSchema.partial();

export type Train = z.infer<typeof trainSchema>;
export type CreateTrainInput = z.infer<typeof createTrainSchema>;
export type UpdateTrainInput = z.infer<typeof updateTrainSchema>;

export type TrainFilters = {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export type TrainsResponse = {
    data: Train[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}
