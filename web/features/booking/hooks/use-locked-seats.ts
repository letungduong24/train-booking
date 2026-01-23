import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export const useLockedSeats = (tripId?: string) => {
    return useQuery({
        queryKey: ['locked-seats', tripId],
        queryFn: async () => {
            if (!tripId) return [];
            const response = await apiClient.get(`/bookings/locked-seats/${tripId}`);
            return response.data.seatIds as string[];
        },
        enabled: !!tripId,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
    });
};
