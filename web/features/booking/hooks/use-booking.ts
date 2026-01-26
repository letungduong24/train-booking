import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { z } from 'zod';
import { BookingResponseSchema } from '@/lib/schemas/booking.schema';

export type BookingResponse = z.infer<typeof BookingResponseSchema>;

const fetchBooking = async (code: string): Promise<BookingResponse> => {
    const response = await apiClient.get<BookingResponse>(`/bookings/${code}`);
    return response.data;
};

export const useBooking = (code: string | null, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['booking', code],
        queryFn: () => fetchBooking(code!),
        enabled: enabled && !!code,
        retry: 1,
    });
};
