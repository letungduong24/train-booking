import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterTrainDto {
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
    sort?: string;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    order?: 'asc' | 'desc';
}
