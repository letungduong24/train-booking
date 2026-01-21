import { IsArray, IsOptional, IsString, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class PassengerInfoDto {
    @IsString()
    seatId: string;

    @IsString()
    passengerName: string;

    @IsString()
    @Matches(/^(\d{12}|N\/A)$/, {
        message: 'passengerId must be exactly 12 digits or "N/A" for children',
    })
    passengerId: string; // CCCD/CMND (12 digits) hoặc "N/A" cho trẻ em

    @IsString()
    passengerGroupId: string;
}

export class CreateBookingDto {
    @IsString()
    tripId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PassengerInfoDto)
    passengers: PassengerInfoDto[];

    @IsString()
    fromStationId: string;

    @IsString()
    toStationId: string;
}
