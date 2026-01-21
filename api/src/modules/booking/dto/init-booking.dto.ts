import { IsArray, IsString } from 'class-validator';

export class InitBookingDto {
    @IsString()
    tripId: string;

    @IsArray()
    @IsString({ each: true })
    seatIds: string[];

    @IsString()
    fromStationId: string;

    @IsString()
    toStationId: string;
}
