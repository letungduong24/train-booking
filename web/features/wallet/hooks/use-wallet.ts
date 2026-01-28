import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    paymentMethod?: string;
    status: TransactionStatus;
    description: string | null;
    createdAt: string;
    referenceId?: string;
    bankName?: string;
    bankAccount?: string;
    accountName?: string;
}

export interface WalletInfo {
    balance: number;
    hasPin: boolean;
    transactions: Transaction[];
}

export function useWallet() {
    const queryClient = useQueryClient();

    const { data: wallet, isLoading, error } = useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const res = await apiClient.get<WalletInfo>('/wallet/info');
            return res.data;
        }
    });

    const setupPinMutation = useMutation({
        mutationFn: async (pin: string) => {
            return apiClient.post('/wallet/setup-pin', { pin });
        },
        onSuccess: () => {
            toast.success('Thiết lập mã PIN thành công');
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Lỗi khi thiết lập PIN');
        }
    });

    const depositMutation = useMutation({
        mutationFn: async (amount: number) => {
            return apiClient.post<{ url: string }>('/wallet/deposit', { amount });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            window.location.href = data.data.url;
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu nạp tiền');
        }
    });

    const withdrawMutation = useMutation({
        mutationFn: async (data: { amount: number, bankName: string, bankAccount: string, accountName: string }) => {
            return apiClient.post('/wallet/withdraw', data);
        },
        onSuccess: () => {
            toast.success('Gửi yêu cầu rút tiền thành công');
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Lỗi khi rút tiền');
        }
    });

    return {
        wallet,
        isLoading,
        error,
        setupPin: setupPinMutation.mutate,
        isSettingPin: setupPinMutation.isPending,
        withdraw: withdrawMutation.mutate,
        isWithdrawing: withdrawMutation.isPending,
        deposit: depositMutation.mutate,
        isDepositing: depositMutation.isPending
    };
}
