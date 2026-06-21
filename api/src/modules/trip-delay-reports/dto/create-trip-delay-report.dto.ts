import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min, MinLength } from 'class-validator';
import { TripDelayType } from '../../../generated/client';

export class CreateTripDelayReportDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsEnum(TripDelayType)
  type: TripDelayType;

  @IsInt()
  @Min(1)
  @Max(720)
  minutes: number;

  @IsString()
  @MinLength(10)
  reason: string;
}
