import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTrainDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    status?: string;
}
