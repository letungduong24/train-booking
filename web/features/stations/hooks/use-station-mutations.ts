import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { CreateStationInput, UpdateStationInput } from '@/lib/schemas/station.schema';
import { toast } from 'sonner';

// Create station mutation
export const useCreateStation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateStationInput) => {
            const response = await apiClient.post('/station', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations'] });
            toast.success('Tạo trạm thành công');
        },
        onError: (error) => {
            toast.error('Tạo trạm thất bại');
            console.error(error);
        },
    });
};

// Update station mutation
export const useUpdateStation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateStationInput }) => {
            const response = await apiClient.patch(`/station/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations'] });
            toast.success('Cập nhật trạm thành công');
        },
        onError: (error) => {
            toast.error('Cập nhật trạm thất bại');
            console.error(error);
        },
    });
};

// Delete station mutation with smart pagination
export const useDeleteStation = (options?: {
    onBeforeDelete?: () => void;
    onAfterDelete?: () => void;
}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            options?.onBeforeDelete?.();
            const response = await apiClient.delete(`/station/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations'] });
            options?.onAfterDelete?.();
            toast.success('Xóa trạm thành công');
        },
        onError: (error) => {
            toast.error('Xóa trạm thất bại');
            console.error(error);
        },
    });
};
