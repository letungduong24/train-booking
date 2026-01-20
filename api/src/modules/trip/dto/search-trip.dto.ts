import { IsString, IsDateString } from 'class-validator';

export class SearchTripDto {
    @IsString()
    fromStationId: string;

    @IsString()
    toStationId: string;

    @IsDateString()
    date: string; // YYYY-MM-DD format
}
