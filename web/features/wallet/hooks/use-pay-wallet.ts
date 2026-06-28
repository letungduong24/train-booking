import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface PayWalletInput {
    bookingCode: string;
    pin: string;
}

export const usePayWallet = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: PayWalletInput) => {
            const response = await apiClient.post('/wallet/pay', data);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['my-active-trips'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
            queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingCode] });
        },
    });
};
