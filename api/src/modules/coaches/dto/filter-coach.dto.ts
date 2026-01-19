import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../lib/dto/pagination.dto';

export class FilterCoachDto extends PaginationDto {
    @IsOptional()
    @IsUUID()
    trainId?: string;

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
