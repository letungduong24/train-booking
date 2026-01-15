import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Station } from '@/lib/schemas/station.schema';

export type StationFilters = {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export type StationsResponse = {
    data: Station[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

const fetchStations = async (filters: StationFilters) => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);

    const response = await apiClient.get<StationsResponse>(`/station?${params.toString()}`);
    return response.data;
};

export const useStations = (filters: StationFilters) => {
    return useQuery({
        queryKey: ['stations', filters],
        queryFn: () => fetchStations(filters),
        placeholderData: keepPreviousData,
    });
};
