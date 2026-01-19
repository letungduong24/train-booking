import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Train, CreateTrainInput, UpdateTrainInput, TrainsResponse, TrainFilters } from '@/lib/schemas/train.schema';

export type { Train, CreateTrainInput, UpdateTrainInput };

// API functions
const fetchTrains = async (filters: TrainFilters) => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);

    const response = await apiClient.get<TrainsResponse>(`/train?${params.toString()}`);
    return response.data;
};

const fetchTrain = async (id: string) => {
    const response = await apiClient.get<Train>(`/train/${id}`);
    return response.data;
};

const createTrain = async (data: CreateTrainInput) => {
    const response = await apiClient.post<Train>('/train', data);
    return response.data;
};

const updateTrain = async ({ id, data }: { id: string; data: UpdateTrainInput }) => {
    const response = await apiClient.patch<Train>(`/train/${id}`, data);
    return response.data;
};

const deleteTrain = async (id: string) => {
    const response = await apiClient.delete(`/train/${id}`);
    return response.data;
};

// Hooks
export const useTrains = (filters: TrainFilters) => {
    return useQuery({
        queryKey: ['trains', filters],
        queryFn: () => fetchTrains(filters),
        placeholderData: keepPreviousData,
    });
};

export const useTrain = (id: string) => {
    return useQuery({
        queryKey: ['trains', id],
        queryFn: () => fetchTrain(id),
        enabled: !!id,
    });
};

export const useCreateTrain = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTrain,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trains'] });
        },
    });
};

export const useUpdateTrain = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateTrain,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trains'] });
        },
    });
};

export const useDeleteTrain = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTrain,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trains'] });
        },
    });
};
