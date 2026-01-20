import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateTripDto {
    @IsString()
    @IsNotEmpty()
    routeId: string;

    @IsString()
    @IsNotEmpty()
    trainId: string;

    @IsDateString()
    @IsNotEmpty()
    departureTime: string;
}
