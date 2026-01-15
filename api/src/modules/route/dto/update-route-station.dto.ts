import { IsNumber, IsString } from 'class-validator';

export class UpdateRouteStationDto {
    @IsString()
    name: string;

    @IsNumber()
    latitute: number;

    @IsNumber()
    longtitute: number;

    @IsNumber()
    distanceFromStart: number;
}
