import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPinDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Mã PIN phải có ít nhất 6 ký tự' })
  pin: string;
}
