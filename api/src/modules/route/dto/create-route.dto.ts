import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
}
