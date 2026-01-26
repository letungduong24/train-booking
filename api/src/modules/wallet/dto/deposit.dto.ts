import { IsNumber, Min } from 'class-validator';

export class DepositDto {
    @IsNumber()
    @Min(10000)
    amount: number;
}
