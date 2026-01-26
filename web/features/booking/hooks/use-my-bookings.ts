import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { z } from 'zod';
import { BookingSchema } from '@/lib/schemas/booking.schema';

export type Booking = z.infer<typeof BookingSchema>;

interface UseMyBookingsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string | null;
}

export const useMyBookings = (params: UseMyBookingsParams) => {
    return useQuery({
        queryKey: ['my-bookings', params],
        queryFn: async () => {
            const { page = 1, limit = 10, search, status } = params;
            const response = await apiClient.get('/bookings/my-bookings', {
                params: {
                    page,
                    limit,
                    search,
                    status: status === 'ALL' ? undefined : status, // Handle "ALL" as undefined
                },
            });
            return response.data as {
                data: Booking[];
                meta: {
                    total: number;
                    page: number;
                    limit: number;
                    totalPages: number;
                };
            };
        },
    });
};
