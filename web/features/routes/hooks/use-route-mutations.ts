import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { CreateRouteInput, UpdateRouteInput } from '@/lib/schemas/route.schema';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const useCreateRoute = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: CreateRouteInput) => {
            const response = await apiClient.post('/route', data);
            return response.data;
        },
        onSuccess: (data: any) => {
            toast.success('Tạo tuyến đường thành công');
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            router.push(`/admin/routes/${data.id}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Tạo tuyến đường thất bại');
        },
    });
};

export const useUpdateRoute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateRouteInput }) => {
            const response = await apiClient.patch(`/route/${id}`, data);
            return response.data;
        },
        onSuccess: (data: any) => {
            toast.success('Cập nhật tuyến đường thành công');
            queryClient.invalidateQueries({ queryKey: ['route', data.id] });
            queryClient.invalidateQueries({ queryKey: ['routes'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Cập nhật tuyến đường thất bại');
        },
    });
};

export const useDeleteRoute = (options?: {
    onBeforeDelete?: () => void;
    onAfterDelete?: () => void;
}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            options?.onBeforeDelete?.();
            await apiClient.delete(`/route/${id}`);
        },
        onSuccess: () => {
            toast.success('Xóa tuyến đường thành công');
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            options?.onAfterDelete?.();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Xóa tuyến đường thất bại');
        },
    });
};

export const useUpdateRouteStation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ routeId, stationId, data }: { routeId: string, stationId: string, data: any }) => {
            const response = await apiClient.patch(`/route/${routeId}/stations/${stationId}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            toast.success('Cập nhật trạm thành công');
            queryClient.invalidateQueries({ queryKey: ['route', variables.routeId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Cập nhật trạm thất bại');
        },
    });
};

export const useReorderStations = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ routeId, stations }: { routeId: string; stations: { stationId: string; distanceFromStart: number }[] }) => {
            const response = await apiClient.post(`/route/${routeId}/stations/reorder`, { stations });
            return response.data;
        },
        onSuccess: (_, variables) => {
            toast.success('Cập nhật thứ tự trạm thành công');
            queryClient.invalidateQueries({ queryKey: ['route', variables.routeId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Cập nhật thứ tự trạm thất bại');
        },
    });
};
