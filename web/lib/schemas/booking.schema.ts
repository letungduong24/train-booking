import { z } from 'zod';

export const PassengerInfoSchema = z.object({
    seatId: z.string(),
    passengerName: z.string(),
    passengerId: z.string(), // CCCD
    passengerGroupId: z.string(),
    price: z.number().optional(),
    fromStationIndex: z.number().optional(),
    toStationIndex: z.number().optional(),
    ageCategory: z.enum(['child', 'adult']).optional(),
});

export const PassengerFormDataSchema = z.object({
    seatId: z.string(),
    seatName: z.string(),
    passengerName: z.string(),
    passengerId: z.string(),
    passengerGroupId: z.string(),
    ageCategory: z.enum(['child', 'adult']),
});

export type PassengerFormData = z.infer<typeof PassengerFormDataSchema>;

export const CreateBookingInputSchema = z.object({
    tripId: z.string(),
    passengers: z.array(PassengerInfoSchema),
    fromStationId: z.string(),
    toStationId: z.string(),
});

export const BookingMetadataSchema = z.object({
    tripId: z.string(),
    fromStationId: z.string(),
    toStationId: z.string(),
    seatIds: z.array(z.string()).optional(),
    seats: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number()
    })).optional(),
    passengers: z.array(PassengerInfoSchema).optional(),
});

import { routeStationSchema } from './route.schema';

const bookingRouteStationSchema = routeStationSchema.extend({
    durationFromStart: z.number().optional(), // Frontend expects this, though backend might not explicitly send it yet
});

export const BookingTripSchema = z.object({
    id: z.string(),
    departureTime: z.string(),
    endTime: z.string(),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    route: z.object({
        name: z.string(),
        stations: z.array(bookingRouteStationSchema).optional(),
    }),
    train: z.object({
        code: z.string(),
    }),
});

export const BookingTicketSchema = z.object({
    id: z.string(),
    code: z.string().optional(),
    price: z.number(),
    status: z.string().optional(),
    passengerName: z.string(),
    passengerId: z.string().optional(),
    seatId: z.string().optional(),
    bookingId: z.string().optional(),
    fromStationIndex: z.number().optional(),
    toStationIndex: z.number().optional(),
    seat: z.object({
        name: z.string(),
    }).optional(),
});

export const BookingSchema = z.object({
    id: z.string(),
    code: z.string(),
    status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'PAYMENT_FAILED']),
    totalPrice: z.number(),
    createdAt: z.string(),
    expiresAt: z.string(),
    trip: BookingTripSchema,
    tickets: z.array(BookingTicketSchema), // Can be refined
    metadata: BookingMetadataSchema.optional(),
});

export const BookingResponseSchema = BookingSchema; // Alias for consistency if needed

export const tripSearchSchema = z.object({
    fromStationId: z.string().min(1, 'Vui lòng chọn ga đi'),
    toStationId: z.string().min(1, 'Vui lòng chọn ga đến'),
    date: z.string(),
});

export type TripSearchInput = z.infer<typeof tripSearchSchema>;

export const CreateBookingResponseSchema = z.object({
    bookingId: z.string(),
    bookingCode: z.string(),
    paymentUrl: z.string(),
});
