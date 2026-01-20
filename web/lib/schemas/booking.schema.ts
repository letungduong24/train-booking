import { z } from 'zod';

// Schema for trip search
export const tripSearchSchema = z.object({
    fromStationId: z.string().min(1, 'Vui lòng chọn ga đi'),
    toStationId: z.string().min(1, 'Vui lòng chọn ga đến'),
    date: z.string().min(1, 'Vui lòng chọn ngày đi'),
});

export type TripSearchInput = z.infer<typeof tripSearchSchema>;

// Schema for seat selection
export const seatSelectionSchema = z.object({
    seatId: z.string(),
    price: z.number(),
});

export type SeatSelectionInput = z.infer<typeof seatSelectionSchema>;
