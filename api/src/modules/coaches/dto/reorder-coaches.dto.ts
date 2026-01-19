import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CoachItemDto {
    @IsString()
    coachId: string;
}

export class ReorderCoachesDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CoachItemDto)
    coaches: CoachItemDto[];
}
