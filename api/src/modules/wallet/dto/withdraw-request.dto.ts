import { IsString, IsNotEmpty, IsNumber, Min, IsPositive } from 'class-validator';

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
}
