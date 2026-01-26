import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class PayBookingWalletDto {
    @IsString()
    @IsNotEmpty()
    bookingCode: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    @Matches(/^[0-9]+$/, { message: 'PIN must contain only numbers' })
    pin: string;
}
