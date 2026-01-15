import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Station } from '@/lib/schemas/station.schema';

export type AvailableStationsFilters = {
    routeId: string;
    page: number;
    limit: number;
    search?: string;
}

export type AvailableStationsResponse = {
    data: Station[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

const fetchAvailableStations = async (filters: AvailableStationsFilters) => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get<AvailableStationsResponse>(
        `/route/${filters.routeId}/stations/available?${params.toString()}`
    );
    return response.data;
};

export const useAvailableStations = (filters: AvailableStationsFilters) => {
    return useQuery({
        queryKey: ['available-stations', filters],
        queryFn: () => fetchAvailableStations(filters),
        placeholderData: keepPreviousData,
        enabled: !!filters.routeId, // Only fetch if routeId exists
    });
};
