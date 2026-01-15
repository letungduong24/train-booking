import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../lib/dto/pagination.dto';

export class FilterRouteDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @IsString()
    order?: 'asc' | 'desc';
}
