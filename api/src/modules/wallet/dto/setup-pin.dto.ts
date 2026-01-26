import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class SetupPinDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    @Matches(/^[0-9]+$/, { message: 'PIN must contain only numbers' })
    pin: string;
}

export class ChangePinDto {
    @IsString()
    @IsNotEmpty()
    oldPin: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    @Matches(/^[0-9]+$/, { message: 'PIN must contain only numbers' })
    newPin: string;
}
