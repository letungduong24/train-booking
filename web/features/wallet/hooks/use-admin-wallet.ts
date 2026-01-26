import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { Transaction } from './use-wallet';

export interface WithdrawalRequest extends Transaction {
    user: {
        id: string;
        name: string;
        email: string;
    }
}

export function useAdminWithdrawals() {
    const queryClient = useQueryClient();

    const { data: withdrawals, isLoading } = useQuery({
        queryKey: ['admin-withdrawals'],
        queryFn: async () => {
            const res = await apiClient.get<WithdrawalRequest[]>('/admin/wallet/withdrawals');
            return res.data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            return apiClient.post('/admin/wallet/approve-withdraw', { transactionId });
        },
        onSuccess: () => {
            toast.success('Đã duyệt yêu cầu rút tiền');
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Lỗi khi duyệt');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            return apiClient.post('/admin/wallet/reject-withdraw', { transactionId });
        },
        onSuccess: () => {
            toast.success('Đã từ chối yêu cầu');
            queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Lỗi khi từ chối');
        }
    });

    return {
        withdrawals,
        isLoading,
        approve: approveMutation.mutate,
        isApproving: approveMutation.isPending,
        reject: rejectMutation.mutate,
        isRejecting: rejectMutation.isPending
    };
}
