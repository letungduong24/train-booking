import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface BookingResponse {
    id: string;
    code: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    totalPrice: number;
    metadata?: {
        tripId: string;
        fromStationId: string;
        toStationId: string;
        seatIds?: string[];
        seats?: Array<{ id: string; name: string; price: number }>;
        passengers?: Array<{
            seatId: string;
            passengerName: string;
            passengerId: string;
            passengerGroupId: string;
            price?: number;
            fromStationIndex?: number;
            toStationIndex?: number;
        }>;
    };
    trip: any;
    tickets: any[];
}

const fetchBooking = async (code: string): Promise<BookingResponse> => {
    const response = await apiClient.get<BookingResponse>(`/bookings/${code}`);
    return response.data;
};

export const useBooking = (code: string | null, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['booking', code],
        queryFn: () => fetchBooking(code!),
        enabled: enabled && !!code,
        retry: 1,
    });
};
