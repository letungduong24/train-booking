import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateCoachDto {
    @IsUUID()
    trainId: string;

    @IsUUID()
    templateId: string;

    @IsOptional()
    @IsString()
    status?: string;
}
