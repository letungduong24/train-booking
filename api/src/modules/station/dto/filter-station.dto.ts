import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../lib/dto/pagination.dto';

export class FilterStationDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @IsString()
    order?: 'asc' | 'desc';
}
