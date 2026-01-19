import { z } from "zod";
import { seatSchema } from "./seat.schema";

// Enums
export const CoachLayoutEnum = z.enum(['SEAT', 'BED']);

// Inferred Types
export type CoachLayout = z.infer<typeof CoachLayoutEnum>;

// Schemas
export const coachTemplateSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    description: z.string().optional(),
    layout: CoachLayoutEnum,
    totalRows: z.number(),
    totalCols: z.number(),
    tiers: z.number(),
});

export const coachSchema = z.object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    status: z.string(),
    trainId: z.string(),
    template: coachTemplateSchema,
    seats: z.array(seatSchema),
});

// Create/Update Input Schemas
export const createCoachSchema = z.object({
    trainId: z.string().uuid(),
    templateId: z.string().uuid(),
    status: z.string().optional(),
});

export const updateCoachSchema = z.object({
    name: z.string().optional(),
    order: z.number().optional(),
    status: z.string().optional(),
});

// Inferred Types
export type CoachTemplate = z.infer<typeof coachTemplateSchema>;
export type Coach = z.infer<typeof coachSchema>;
export type CreateCoachInput = z.infer<typeof createCoachSchema>;
export type UpdateCoachInput = z.infer<typeof updateCoachSchema>;

export type CoachFilters = {
    page: number;
    limit: number;
    trainId?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
};

export type CoachesResponse = {
    data: Coach[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};
