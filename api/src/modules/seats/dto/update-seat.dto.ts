import { IsEnum, IsOptional } from 'class-validator';
import { SeatStatus, SeatType } from '../../../generated/client';

export class UpdateSeatDto {
    @IsOptional()
    @IsEnum(SeatStatus)
    status?: SeatStatus;

    @IsOptional()
    @IsEnum(SeatType)
    type?: SeatType;
}
