import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Route } from '@/lib/schemas/route.schema';

const fetchRoute = async (id: string) => {
    const response = await apiClient.get<Route>(`/route/${id}`);
    return response.data;
};

export const useRoute = (id: string) => {
    return useQuery({
        queryKey: ['route', id],
        queryFn: () => fetchRoute(id),
        enabled: !!id,
    });
};
