import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { type Booking } from '@/features/booking/hooks/use-my-bookings';

export interface DashboardOverview {
    upcomingTrips: Booking[];
    pendingBookings: Booking[];
    activeTrips: Booking[];
    recentTransactions: Transaction[];
    stats: {
        balance: number;
        totalBookings: number;
        pendingCount: number;
        activeCount: number;
    };
}

export interface Transaction {
    id: string;
    amount: number;
    type: 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    description: string;
    createdAt: string;
    paymentMethod?: string;
}

export const useDashboardOverview = () => {
    return useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: async () => {
            const response = await apiClient.get('/dashboard/overview');
            return response.data as DashboardOverview;
        },
    });
};
