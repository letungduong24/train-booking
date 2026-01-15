import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRouteDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    status?: string;
}
