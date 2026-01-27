import { Controller, Get, Post, Body, Query, Res, HttpStatus, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { BookingService } from '../booking/booking.service';
import { WalletService } from '../wallet/wallet.service';
import { Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => BookingService))
        private readonly bookingService: BookingService,
        @Inject(forwardRef(() => WalletService))
        private readonly walletService: WalletService,
        private readonly prisma: PrismaService,
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
        // Xác thực chữ ký từ VNPAY
        const result = this.paymentService.verifyReturnUrl(query);

        // Phân biệt Deposit (nạp tiền) vs Booking (đặt vé)
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: result.orderId }
        });
        const isDeposit = transaction?.type === 'DEPOSIT';

        let paymentSuccess = result.isSuccess;

        if (result.isSuccess) {
            try {
                if (isDeposit) {
                    // Xử lý nạp tiền vào ví
                    await this.walletService.processDeposit(result.orderId);
                } else {
                    // Xử lý thanh toán vé
                    const booking = await this.prisma.booking.findUnique({
                        where: { code: result.orderId },
                        select: { userId: true, totalPrice: true }
                    });

                    if (!booking?.userId) {
                        throw new Error('Booking không tồn tại hoặc thiếu userId');
                    }

                    // Tạo Transaction và confirm booking
                    await this.paymentService.payBooking(
                        result.orderId,
                        booking.userId,
                        booking.totalPrice
                    );
                }
            } catch (error) {
                console.error('Failed to process payment:', error);
                // Nếu có lỗi (race condition, etc.) → Đánh dấu payment failed
                paymentSuccess = false;
            }
        }

        // Redirect về frontend
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        let redirectUrl = '';

        if (isDeposit) {
            redirectUrl = `${frontendUrl}/user/wallet?deposit=${paymentSuccess ? 'success' : 'failed'}&amount=${query.vnp_Amount ? parseInt(query.vnp_Amount) / 100 : 0}`;
        } else {
            if (paymentSuccess) {
                redirectUrl = `${frontendUrl}/booking/payment-result?success=true&orderId=${result.orderId}&code=${result.responseCode}`;
            } else {
                redirectUrl = `${frontendUrl}/booking/payment-result?success=false&orderId=${result.orderId}&code=${result.responseCode}`;
            }
        }

        return res.redirect(redirectUrl);
    }

    @Get('vnpay_ipn')
    async vnpayIpn(@Query() query: any) {
        // Xác thực chữ ký từ VNPAY
        const result = this.paymentService.verifyReturnUrl(query);

        // Phân biệt Deposit vs Booking
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: result.orderId }
        });
        const isDeposit = transaction?.type === 'DEPOSIT';

        // Cập nhật trạng thái nếu thanh toán thành công
        if (result.isSuccess) {
            try {
                if (isDeposit) {
                    await this.walletService.processDeposit(result.orderId);
                    console.log(`IPN: Deposit ${result.orderId} confirmed`);
                } else {
                    const booking = await this.prisma.booking.findUnique({
                        where: { code: result.orderId },
                        select: { userId: true, totalPrice: true }
                    });

                    if (!booking?.userId) {
                        throw new Error('Booking không tồn tại hoặc thiếu userId');
                    }

                    await this.paymentService.payBooking(
                        result.orderId,
                        booking.userId,
                        booking.totalPrice
                    );
                    console.log(`IPN: Booking ${result.orderId} confirmed`);
                }
            } catch (error) {
                console.error(`IPN: Failed to process ${result.orderId}`, error);
            }
        }

        // Trả về response cho VNPAY
        return { RspCode: '00', Message: 'Success' };
    }
}
