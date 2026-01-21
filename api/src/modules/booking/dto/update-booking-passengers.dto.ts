import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PassengerInfoDto } from './create-booking.dto';

export class UpdateBookingPassengersDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PassengerInfoDto)
    passengers: PassengerInfoDto[];
}
