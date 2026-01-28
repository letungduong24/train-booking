import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useSocketStore } from '@/lib/store/socket.store';

export interface TripStats {
    revenue: number;
    ticketsSold: number;
    ticketsPending: number;
    occupancy: number;
}

export function useTripStats(tripId: string) {
    const queryClient = useQueryClient();
    const { socket, connect } = useSocketStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['trip-stats', tripId],
        queryFn: async () => {
            const response = await apiClient.get<TripStats>(`/trip/${tripId}/stats`);
            return response.data;
        },
        enabled: !!tripId,
    });

    // Connect to socket when component mounts
    useEffect(() => {
        connect();
    }, [connect]);

    useEffect(() => {
        if (!tripId || !socket) return;

        const handleStatsUpdate = (payload: { tripId: string; stats: TripStats }) => {
            if (payload.tripId === tripId) {
                queryClient.setQueryData(['trip-stats', tripId], payload.stats);
            }
        };

        socket.on('trip.stats_update', handleStatsUpdate);

        return () => {
            socket.off('trip.stats_update', handleStatsUpdate);
        };
    }, [tripId, socket, queryClient]);

    return { data, isLoading, error };
}

