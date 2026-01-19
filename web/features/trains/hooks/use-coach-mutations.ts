import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
    Coach,
    CreateCoachInput,
    UpdateCoachInput,
    CoachFilters,
    CoachesResponse
} from '@/lib/schemas/coach.schema';

export type { Coach, CreateCoachInput, UpdateCoachInput };

// API functions
const fetchCoaches = async (filters: CoachFilters) => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.trainId) params.append('trainId', filters.trainId);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);

    const response = await apiClient.get<CoachesResponse>(`/coaches?${params.toString()}`);
    return response.data;
};

const fetchCoach = async (id: string) => {
    const response = await apiClient.get<Coach>(`/coaches/${id}`);
    return response.data;
};

const createCoach = async (data: CreateCoachInput) => {
    const response = await apiClient.post<Coach>('/coaches', data);
    return response.data;
};

const updateCoach = async ({ id, data }: { id: string; data: UpdateCoachInput }) => {
    const response = await apiClient.patch<Coach>(`/coaches/${id}`, data);
    return response.data;
};

const deleteCoach = async (id: string) => {
    const response = await apiClient.delete(`/coaches/${id}`);
    return response.data;
};

const reorderCoaches = async ({ trainId, coaches }: { trainId: string; coaches: { coachId: string }[] }) => {
    const response = await apiClient.post(`/coaches/train/${trainId}/reorder`, { coaches });
    return response.data;
};

// Hooks
export const useCoaches = (filters: CoachFilters) => {
    return useQuery({
        queryKey: ['coaches', filters],
        queryFn: () => fetchCoaches(filters),
    });
};

export const useCoach = (id: string) => {
    return useQuery({
        queryKey: ['coaches', id],
        queryFn: () => fetchCoach(id),
        enabled: !!id,
    });
};

// Lazy load coach detail with seats when coach is selected
export const useCoachDetail = (coachId: string | null) => {
    return useQuery({
        queryKey: ['coaches', 'detail', coachId],
        queryFn: () => fetchCoach(coachId!),
        enabled: !!coachId,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
};
export const useCreateCoach = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCoach,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trains'] });
        },
    });
};

export const useUpdateCoach = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCoach,
        onSuccess: (updatedCoach) => {
            // Invalidate specific coach detail
            queryClient.invalidateQueries({ queryKey: ['coaches', 'detail', updatedCoach.id] });

            // Manually update the coach in the train cache to avoid refetching the whole train
            // This prevents "Toa 1" refetch issue user mentioned
            if (updatedCoach.trainId) {
                queryClient.setQueryData(['trains', updatedCoach.trainId], (oldData: any) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        coaches: oldData.coaches.map((c: Coach) =>
                            c.id === updatedCoach.id ? { ...c, ...updatedCoach } : c
                        )
                    };
                });
            } else {
                // Fallback if trainId is missing (shouldn't happen for update)
                queryClient.invalidateQueries({ queryKey: ['trains'] });
            }
        },
    });
};

export const useDeleteCoach = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCoach,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trains'] });
        },
    });
};

export const useReorderCoaches = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: reorderCoaches,
    });
};
