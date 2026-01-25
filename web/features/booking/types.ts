export interface Passenger {
    seatId: string;
    price: number;
    passengerName: string;
    passengerId: string;
    passengerGroupId: string;
    fromStationIndex?: number;
    toStationIndex?: number;
    seat?: {
        name: string;
    };
}

export interface BookingMetadata {
    tripId?: string;
    fromStationId?: string;
    toStationId?: string;
    seatIds?: string[];
    passengers?: Passenger[];
    [key: string]: any;
}
