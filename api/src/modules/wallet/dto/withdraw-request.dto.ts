import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsPositive,
  Length,
  Matches,
} from 'class-validator';

export class WithdrawRequestDto {
  @IsNumber()
  @IsPositive()
  @Min(10000) // Minimum 10k VND
  amount: number;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  bankAccount: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^[0-9]+$/, { message: 'PIN must contain only numbers' })
  pin: string;
}
