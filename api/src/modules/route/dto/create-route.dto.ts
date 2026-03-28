import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RouteStationInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  turnaroundMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePricePerKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stationFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDistanceKm?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RouteStationInput)
  stations?: RouteStationInput[];

  @IsOptional()
  pathCoordinates?: any;
}
