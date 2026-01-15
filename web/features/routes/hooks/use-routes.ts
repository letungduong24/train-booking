import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Route } from '@/lib/schemas/route.schema';

export type RouteFilters = {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export type RoutesResponse = {
    data: Route[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

const fetchRoutes = async (filters: RouteFilters) => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);

    const response = await apiClient.get<RoutesResponse>(`/route?${params.toString()}`);
    return response.data;
};

export const useRoutes = (filters: RouteFilters) => {
    return useQuery({
        queryKey: ['routes', filters],
        queryFn: () => fetchRoutes(filters),
        placeholderData: keepPreviousData,
    });
};
