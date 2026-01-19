import { z } from "zod";

// Enums
export const SeatStatusEnum = z.enum(['AVAILABLE', 'BOOKED', 'LOCKED', 'DISABLED', 'SELECTED']);
export const SeatTypeEnum = z.enum(['VIP', 'STANDARD', 'ECONOMY', 'OTHER']);

// Inferred Types
export type SeatStatus = z.infer<typeof SeatStatusEnum>;
export type SeatType = z.infer<typeof SeatTypeEnum>;

// Schemas
export const seatSchema = z.object({
    id: z.string(),
    name: z.string(),
    rowIndex: z.number(),
    colIndex: z.number(),
    status: SeatStatusEnum,
    type: SeatTypeEnum,
    coachId: z.string(),
    price: z.number(),
});

export type Seat = z.infer<typeof seatSchema>;

export const updateSeatSchema = z.object({
    status: SeatStatusEnum.optional(),
    type: SeatTypeEnum.optional(),
});

export type UpdateSeatInput = z.infer<typeof updateSeatSchema>;
