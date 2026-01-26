import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SetupPinDto } from './dto/setup-pin.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import { PayBookingWalletDto } from './dto/pay-booking-wallet.dto';
// Assuming you have an Auth Guard for JWT
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from '../payment/payment.service';
import { Inject, forwardRef } from '@nestjs/common';
import { DepositDto } from './dto/deposit.dto';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
    constructor(
        private readonly walletService: WalletService,
        @Inject(forwardRef(() => PaymentService))
        private readonly paymentService: PaymentService
    ) { }

    @Get('info')
    async getWalletInfo(@Req() req) {
        return this.walletService.getWalletInfo(req.user.id);
    }

    @Post('setup-pin')
    async setupPin(@Req() req, @Body() dto: SetupPinDto) {
        return this.walletService.setupPin(req.user.id, dto);
    }

    @Post('withdraw')
    async requestWithdraw(@Req() req, @Body() dto: WithdrawRequestDto) {
        return this.walletService.requestWithdraw(req.user.id, dto);
    }

    @Post('pay')
    async payBooking(@Req() req, @Body() dto: PayBookingWalletDto) {
        return this.walletService.payBooking(req.user.id, dto);
    }

    @Post('deposit')
    async deposit(@Req() req, @Body() dto: DepositDto) {
        // 1. Create Transaction PENDING
        const transaction = await this.walletService.createDeposit(req.user.id, dto.amount);

        // 2. Create Payment URL
        const url = this.paymentService.createPaymentUrl({
            amount: dto.amount,
            bankCode: undefined,
            language: 'vn',
            orderId: transaction.id,
            orderInfo: `Nap tien vi`,
            ipAddr: req.ip || '127.0.0.1'
        });

        return { url };
    }
}
