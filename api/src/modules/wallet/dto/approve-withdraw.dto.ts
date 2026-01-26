import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class ApproveWithdrawDto {
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    // Optional: reject reason or status? Usually just approve.
}
