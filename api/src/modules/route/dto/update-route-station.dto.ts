import { IsNumber, IsString } from 'class-validator';

export class UpdateRouteStationDto {
  @IsString()
  name: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  distanceFromStart: number;
}
