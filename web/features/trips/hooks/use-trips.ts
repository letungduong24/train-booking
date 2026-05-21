import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Trip, CreateTripInput, UpdateTripInput, TripsResponse, TripFilters, LiveLocationResponse } from '@/lib/schemas/trip.schema';

export type { Trip, CreateTripInput, UpdateTripInput, LiveLocationResponse };

// API functions
const fetchTrips = async (filters: TripFilters) => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.routeId) params.append('routeId', filters.routeId);
    if (filters.trainId) params.append('trainId', filters.trainId);
    if (filters.departureTime) params.append('departureTime', filters.departureTime);
    if (filters.status) params.append('status', filters.status);
    if (typeof filters.upcoming === 'boolean') params.append('upcoming', String(filters.upcoming));
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);

    const response = await apiClient.get<TripsResponse>(`/trip?${params.toString()}`);
    return response.data;
};

const fetchTrip = async (id: string) => {
    const response = await apiClient.get<Trip>(`/trip/${id}`);
    return response.data;
};

const createTrip = async (data: CreateTripInput) => {
    const response = await apiClient.post<Trip>('/trip', data);
    return response.data;
};

const updateTrip = async ({ id, data }: { id: string; data: UpdateTripInput }) => {
    const response = await apiClient.patch<Trip>(`/trip/${id}`, data);
    return response.data;
};

const deleteTrip = async (id: string) => {
    const response = await apiClient.delete(`/trip/${id}`);
    return response.data;
};

// Hooks
export const useTrips = (filters: TripFilters) => {
    return useQuery({
        queryKey: ['trips', filters],
        queryFn: () => fetchTrips(filters),
        placeholderData: keepPreviousData,
    });
};

export const useTrip = (id: string, from?: string, to?: string) => {
    return useQuery({
        queryKey: ['trips', id, from, to],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            
            const queryString = params.toString() ? `?${params.toString()}` : '';
            const response = await apiClient.get(`/trip/${id}${queryString}`);
            return response.data as import('@/lib/schemas/trip.schema').TripDetail & {
                resolvedFrom?: any;
                resolvedTo?: any;
            };
        },
        enabled: !!id,
    });
};

export const useCreateTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTrip,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });
};

export const useUpdateTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateTrip,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });
};

export const useDeleteTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTrip,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });
};

export const useTripLiveLocation = (id: string, enabled: boolean = false, speedup?: number) => {
    return useQuery({
        queryKey: ['trips', id, 'live-location', speedup],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (speedup !== undefined) {
                params.append('speedup', speedup.toString());
            }
            const queryString = params.toString() ? `?${params.toString()}` : '';
            const response = await apiClient.get<LiveLocationResponse>(`/trip/${id}/live-location${queryString}`);
            return response.data;
        },
        enabled: !!id && enabled,
        refetchInterval: enabled ? 5000 : false, // Poll every 5 seconds
        refetchIntervalInBackground: false,
    });
};
