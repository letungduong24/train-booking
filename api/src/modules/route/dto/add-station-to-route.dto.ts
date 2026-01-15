
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AddStationToRouteDto {
    @IsNotEmpty()
    @IsString()
    stationId: string;

    @IsNotEmpty()
    @IsNumber()
    index: number;

    @IsNotEmpty()
    @IsNumber()
    distanceFromStart: number;
}
