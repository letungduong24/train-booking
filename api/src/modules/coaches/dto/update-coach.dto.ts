import { PartialType } from '@nestjs/mapped-types';
import { CreateCoachDto } from './create-coach.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCoachDto extends PartialType(CreateCoachDto) {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    order?: number;
}
