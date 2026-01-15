import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateStationDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsNumber()
    latitute: number;

    @IsNotEmpty()
    @IsNumber()
    longtitute: number;
}
