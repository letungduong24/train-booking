import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CoachStatus } from '../../../generated/client';

export class CreateCoachDto {
  @IsUUID()
  trainId: string;

  @IsUUID()
  templateId: string;

  @IsOptional()
  @IsEnum(CoachStatus, { message: 'Trạng thái toa không hợp lệ' })
  status?: CoachStatus;
}
