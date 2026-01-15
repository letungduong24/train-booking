import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StationItemDto {
    @IsString()
    stationId: string;

    @IsNumber()
    distanceFromStart: number;
}

export class ReorderRouteStationsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StationItemDto)
    stations: StationItemDto[];
}
