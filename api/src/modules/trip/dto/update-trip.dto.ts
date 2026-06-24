import { IsOptional, IsString } from 'class-validator';

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  driverId?: string | null;
}
