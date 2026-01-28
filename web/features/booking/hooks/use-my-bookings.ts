import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { z } from 'zod';
import { BookingSchema } from '@/lib/schemas/booking.schema';
import { useSocketStore } from '@/lib/store/socket.store';
import { useEffect } from 'react';

export type Booking = z.infer<typeof BookingSchema>;

interface UseMyBookingsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string | null;
}

export const useMyBookings = (params: UseMyBookingsParams) => {
    const queryClient = useQueryClient();
    const { socket, connect } = useSocketStore();

    useEffect(() => {
        connect();
    }, [connect]);

    useEffect(() => {
        if (!socket) return;

        function onStatusUpdate(data: { bookingCode: string; status: string }) {
            // Optimistically update or invalidate. Here we invalidate list.
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        }

        socket.on("booking.status_update", onStatusUpdate);

        return () => {
            socket.off("booking.status_update", onStatusUpdate);
        };
    }, [socket, queryClient]);

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
