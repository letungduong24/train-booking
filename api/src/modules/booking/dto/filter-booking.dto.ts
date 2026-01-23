import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../lib/dto/pagination.dto';
import { BookingStatus } from '../../../generated/client';

export class FilterBookingDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(BookingStatus)
    status?: BookingStatus;

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @IsString()
    order?: 'asc' | 'desc';
}
