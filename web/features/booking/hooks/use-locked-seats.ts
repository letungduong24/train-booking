import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export const useLockedSeats = (
    tripId?: string,
    fromStationId?: string,
    toStationId?: string,
) => {
    return useQuery({
        queryKey: ['locked-seats', tripId, fromStationId, toStationId],
        queryFn: async () => {
            if (!tripId) return [];
            const response = await apiClient.get(`/bookings/locked-seats/${tripId}`, {
                params: {
                    fromStationId,
                    toStationId,
                },
            });
            return response.data.seatIds as string[];
        },
        enabled: !!tripId,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
    });
};
