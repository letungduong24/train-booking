
import { create } from 'zustand';
import { Route } from '../schemas/route.schema';
import apiClient from '../api-client';

export type RoutesResponse = {
    data: Route[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export type RouteFilters = {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

interface RoutesState {
    routes: Route[];
    meta: RoutesResponse['meta'];
    isLoading: boolean;
    error: Error | null;
    filters: RouteFilters;
    setFilters: (filters: Partial<RouteFilters> | ((prev: RouteFilters) => Partial<RouteFilters>)) => void;
    fetchRoutes: () => Promise<void>;
}

export const useRoutesStore = create<RoutesState>((set, get) => ({
    routes: [],
    meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
    isLoading: false,
    error: null,
    filters: {
        page: 1,
        limit: 10,
    },
    setFilters: (newFilters) => {
        set((state) => {
            const updatedFilters = typeof newFilters === 'function'
                ? { ...state.filters, ...newFilters(state.filters) }
                : { ...state.filters, ...newFilters };

            // Check if filters strictly changed to avoid loops if needed, 
            // but for simplicity we just update and let the subscriber/caller decide when to fetch.
            // Actually, usually in stores, setting filters triggers fetch or we separate them.
            // Let's keep it simple: just update state. The component useEffect will trigger fetch 
            // OR we can trigger fetch here.
            // Given the previous hook design, the fetch was triggered by effect on filters change.
            // Let's mirror that behavior in the component, OR allow manual trigger.
            return { filters: updatedFilters };
        });
        // We can optionally auto-fetch here:
        get().fetchRoutes();
    },
    fetchRoutes: async () => {
        set({ isLoading: true, error: null });
        const { filters } = get();
        try {
            const params = new URLSearchParams();
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('status', filters.status);
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.order) params.append('order', filters.order);

            const response = await apiClient.get<RoutesResponse>(`/route?${params.toString()}`);
            set({
                routes: response.data.data,
                meta: response.data.meta,
                isLoading: false
            });
        } catch (error) {
            set({ error: error as Error, isLoading: false });
        }
    },
}));
