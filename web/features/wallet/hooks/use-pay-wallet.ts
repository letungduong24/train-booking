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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
};
