import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface PassengerInfo {
    seatId: string;
    passengerName: string;
    passengerId: string;
    passengerGroupId: string;
}

export interface CreateBookingInput {
    tripId: string;
    passengers: PassengerInfo[];
    fromStationId: string;
    toStationId: string;
}

export interface BookingResponse {
    bookingId: string;
    bookingCode: string;
    paymentUrl: string;
}

const createBooking = async (data: CreateBookingInput) => {
    const response = await apiClient.post<BookingResponse>('/bookings', data);
    return response.data;
};

export const useCreateBooking = () => {
    return useMutation({
        mutationFn: createBooking,
    });
};
