import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { z } from 'zod';
import { CreateBookingInputSchema, CreateBookingResponseSchema } from '@/lib/schemas/booking.schema';

export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;
export type BookingResponse = z.infer<typeof CreateBookingResponseSchema>;

const createBooking = async (data: CreateBookingInput) => {
    const response = await apiClient.post<BookingResponse>('/bookings', data);
    return response.data;
};

export const useCreateBooking = () => {
    return useMutation({
        mutationFn: createBooking,
    });
};
