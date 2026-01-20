import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterTripDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    routeId?: string;

    @IsOptional()
    @IsString()
    trainId?: string;

    @IsOptional()
    @IsDateString()
    departureTime?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    order?: 'asc' | 'desc';
}
