import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface InitBookingInput {
    tripId: string;
    seatIds: string[];
    fromStationId: string;
    toStationId: string;
}

export interface InitBookingResponse {
    bookingId: string;
    bookingCode: string;
}

const initBooking = async (data: InitBookingInput) => {
    const response = await apiClient.post<InitBookingResponse>('/bookings/init', data);
    return response.data;
};

export const useInitBooking = () => {
    return useMutation({
        mutationFn: initBooking,
    });
};
