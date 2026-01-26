import { Controller, Get, Post, Body, Query, Res, HttpStatus, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { BookingService } from '../booking/booking.service';
import { WalletService } from '../wallet/wallet.service';
import { Inject, forwardRef } from '@nestjs/common';

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => BookingService))
        private readonly bookingService: BookingService,
        @Inject(forwardRef(() => WalletService))
        private readonly walletService: WalletService,
    ) { }

    @Post('create_payment_url')
    createPaymentUrl(@Body() dto: CreatePaymentDto, @Req() req: Request) {
        // If IP is not provided in DTO, try to get it from request
        let ipAddr = dto.ipAddr;
        if (!ipAddr) {
            ipAddr = (req.headers['x-forwarded-for'] as string) ||
                req.socket.remoteAddress ||
                '127.0.0.1';
        }

        // Pass everything to service
        const url = this.paymentService.createPaymentUrl({
            ...dto,
            ipAddr
        });
        return { url };
    }

    @Get('vnpay_return')
    async vnpayReturn(@Query() query: any, @Res() res: Response) {
        const result = this.paymentService.verifyReturnUrl(query);

        // Logic to determine Booking vs Deposit
        const isDeposit = result.orderId.length > 10; // UUID is 36 chars, Booking Code is 8

        if (result.isSuccess) {
            try {
                if (isDeposit) {
                    await this.walletService.processDeposit(result.orderId);
                } else {
                    await this.bookingService.confirmBooking(result.orderId);
                }
            } catch (error) {
                console.error('Failed to process payment:', error);
            }
        }

        // Redirect to frontend result page
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        let redirectUrl = '';

        if (isDeposit) {
            redirectUrl = `${frontendUrl}/user/wallet?deposit=${result.isSuccess ? 'success' : 'failed'}&amount=${query.vnp_Amount ? parseInt(query.vnp_Amount) / 100 : 0}`;
        } else {
            if (result.isSuccess) {
                redirectUrl = `${frontendUrl}/booking/payment-result?success=true&orderId=${result.orderId}&code=${result.responseCode}`;
            } else {
                redirectUrl = `${frontendUrl}/booking/payment-result?success=false&orderId=${result.orderId}&code=${result.responseCode}`;
            }
        }

        return res.redirect(redirectUrl);
    }

    @Get('vnpay_ipn')
    async vnpayIpn(@Query() query: any) {
        const result = this.paymentService.verifyReturnUrl(query);
        const isDeposit = result.orderId.length > 10;

        // Update booking if payment successful
        if (result.isSuccess) {
            try {
                if (isDeposit) {
                    await this.walletService.processDeposit(result.orderId);
                    console.log(`IPN: Deposit ${result.orderId} confirmed`);
                } else {
                    await this.bookingService.confirmBooking(result.orderId);
                    console.log(`IPN: Booking ${result.orderId} confirmed`);
                }
            } catch (error) {
                console.error(`IPN: Failed to process ${result.orderId}`, error);
            }
        }

        // Return response to VNPAY
        return { RspCode: '00', Message: 'Success' };
    }
}
