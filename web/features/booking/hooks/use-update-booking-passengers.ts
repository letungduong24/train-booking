import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { PassengerFormData } from '@/lib/schemas/booking.schema';

export interface UpdateBookingPassengersInput {
    code: string;
    passengers: Pick<PassengerFormData, 'seatId' | 'passengerName' | 'passengerId' | 'passengerGroupId'>[];
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
