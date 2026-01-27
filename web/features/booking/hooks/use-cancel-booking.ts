import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export const useCancelBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (code: string) => {
            const response = await apiClient.post(`/bookings/${code}/cancel`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking'] });
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        },
    });
};
