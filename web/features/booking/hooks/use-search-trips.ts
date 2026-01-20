import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface SearchTripsParams {
    fromStationId: string;
    toStationId: string;
    date: string;
}

export function useSearchTrips(params: SearchTripsParams, enabled = true) {
    return useQuery({
        queryKey: ['trips', 'search', params],
        queryFn: async () => {
            const response = await apiClient.get('/trip/search', { params });
            return response.data;
        },
        enabled: enabled && !!params.fromStationId && !!params.toStationId && !!params.date,
    });
}
