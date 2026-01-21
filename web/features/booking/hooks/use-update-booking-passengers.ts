import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { PassengerInfo } from './use-create-booking';

export interface UpdateBookingPassengersInput {
    code: string;
    passengers: PassengerInfo[];
}

export interface UpdateBookingResponse {
    bookingCode: string;
    paymentUrl: string;
    totalPrice: number;
}

const updateBookingPassengers = async (data: UpdateBookingPassengersInput) => {
    const response = await apiClient.post<UpdateBookingResponse>(`/bookings/${data.code}/passengers`, {
        passengers: data.passengers
    });
    return response.data;
};

export const useUpdateBookingPassengers = () => {
    return useMutation({
        mutationFn: updateBookingPassengers,
    });
};
