import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface CoachWithPricesParams {
    coachId: string;
    tripId: string;
    fromStationId: string;
    toStationId: string;
}

export function useCoachWithPrices(params: CoachWithPricesParams, enabled = true) {
    return useQuery({
        queryKey: ['coaches', params.coachId, 'prices', params],
        queryFn: async () => {
            const response = await apiClient.get(`/coaches/${params.coachId}/seats-with-prices`, {
                params: {
                    tripId: params.tripId,
                    fromStationId: params.fromStationId,
                    toStationId: params.toStationId,
                },
            });
            return response.data;
        },
        enabled: enabled && !!params.coachId && !!params.tripId && !!params.fromStationId && !!params.toStationId,
    });
}
