import { IsString, MinLength } from 'class-validator';

export class RejectTripDelayReportDto {
  @IsString()
  @MinLength(5)
  rejectReason: string;
}
