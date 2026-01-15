import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../lib/dto/pagination.dto';

export class FilterAvailableStationsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;
}
