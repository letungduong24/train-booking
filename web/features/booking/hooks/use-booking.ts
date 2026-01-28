import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { z } from 'zod';
import { BookingResponseSchema } from '@/lib/schemas/booking.schema';
import { useSocketStore } from '@/lib/store/socket.store';
import { useEffect } from 'react';

export type BookingResponse = z.infer<typeof BookingResponseSchema>;

const fetchBooking = async (code: string): Promise<BookingResponse> => {
    const response = await apiClient.get<BookingResponse>(`/bookings/${code}`);
    return response.data;
};

export const useBooking = (code: string | null, enabled: boolean = true) => {
    const queryClient = useQueryClient();
    const { socket, connect } = useSocketStore();

    useEffect(() => {
        if (!enabled || !code) return;
        connect();
    }, [connect, enabled, code]);

    useEffect(() => {
        if (!code || !socket) return;

        function onStatusUpdate(data: { bookingCode: string; status: string }) {
            if (data.bookingCode === code) {
                queryClient.invalidateQueries({ queryKey: ['booking', code] });
            }
        }

        socket.on("booking.status_update", onStatusUpdate);

        return () => {
            socket.off("booking.status_update", onStatusUpdate);
        };
    }, [code, socket, queryClient]);

    return useQuery({
        queryKey: ['booking', code],
        queryFn: () => fetchBooking(code!),
        enabled: enabled && !!code,
        retry: 1,
    });
};
