export interface Passenger {
    seatId: string;
    price: number;
    passengerName: string;
    passengerId: string;
    passengerGroupId: string;
    fromStationIndex?: number;
    toStationIndex?: number;
}

export interface BookingMetadata {
    tripId?: string;
    fromStationId?: string;
    toStationId?: string;
    seatIds?: string[];
    passengers?: Passenger[];
    [key: string]: any; // Allow extensibility but define core fields
}
