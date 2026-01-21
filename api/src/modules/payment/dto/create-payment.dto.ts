export class CreatePaymentDto {
    amount: number;
    orderId: string; // Internal booking ID
    orderInfo: string;
    bankCode?: string;
    language?: string;
    ipAddr?: string;
}
