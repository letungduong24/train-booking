import { z } from "zod";

// Enums
export const SeatStatusEnum = z.enum(['AVAILABLE', 'LOCKED']);
export const SeatTypeEnum = z.enum(['VIP', 'STANDARD', 'ECONOMY', 'OTHER']);
export const BookingStatusEnum = z.enum(['AVAILABLE', 'BOOKED', 'LOCKED', 'HOLDING']);

// Inferred Types
export type SeatStatus = z.infer<typeof SeatStatusEnum>;
export type SeatType = z.infer<typeof SeatTypeEnum>;
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

// Schemas
export const seatSchema = z.object({
    id: z.string(),
    name: z.string(),
    rowIndex: z.number(),
    colIndex: z.number(),
    status: SeatStatusEnum,
    type: SeatTypeEnum,
    tier: z.number().int().min(0).default(0),
    coachId: z.string(),
    price: z.number(),
    bookingStatus: BookingStatusEnum.optional(), // Booking status for specific trip and route segment
});

export type Seat = z.infer<typeof seatSchema>;

export const updateSeatSchema = z.object({
    status: SeatStatusEnum.optional(),
    type: SeatTypeEnum.optional(),
});

export type UpdateSeatInput = z.infer<typeof updateSeatSchema>;

