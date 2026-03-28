import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { WalletService } from './wallet.service';
import { SetupPinDto } from './dto/setup-pin.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import { PayBookingWalletDto } from './dto/pay-booking-wallet.dto';
// Assuming you have an Auth Guard for JWT
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from '../payment/payment.service';
import { Inject, forwardRef } from '@nestjs/common';
import { DepositDto } from './dto/deposit.dto';
import { ConfigService } from '@nestjs/config';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Get('info')
  async getWalletInfo(@Req() req) {
    const info = await this.walletService.getWalletInfo(req.user.id);
    const timeoutMinutes = this.configService.get<number>('DEPOSIT_TIMEOUT_MINUTES') || 5;

    const mappedTransactions = info.transactions.map((tx) => {
      if (tx.type === 'DEPOSIT' && tx.status === 'PENDING') {
        const url = this.paymentService.createPaymentUrl({
          amount: tx.amount,
          bankCode: undefined, // Let user choose
          language: 'vn',
          orderId: tx.id,
          orderInfo: `Nap tien vi`,
          ipAddr: req.ip || '127.0.0.1',
        });
        const expiresAt = new Date(tx.createdAt.getTime() + timeoutMinutes * 60 * 1000).toISOString();
        return { ...tx, vnpayUrl: url, expiresAt };
      }
      return tx;
    });

    return {
      ...info,
      transactions: mappedTransactions,
    };
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @Post('setup-pin')
  async setupPin(@Req() req, @Body() dto: SetupPinDto) {
    return this.walletService.setupPin(req.user.id, dto);
  }

  @Post('withdraw')
  async requestWithdraw(@Req() req, @Body() dto: WithdrawRequestDto) {
    return this.walletService.requestWithdraw(req.user.id, dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 payments per minute
  @Post('pay')
  async payBooking(@Req() req, @Body() dto: PayBookingWalletDto) {
    return this.walletService.payBooking(req.user.id, dto);
  }

  @Post('deposit')
  async deposit(@Req() req, @Body() dto: DepositDto) {
    // 1. Create Transaction PENDING
    const transaction = await this.walletService.createDeposit(
      req.user.id,
      dto.amount,
    );

    // 2. Create Payment URL
    const url = this.paymentService.createPaymentUrl({
      amount: dto.amount,
      bankCode: undefined,
      language: 'vn',
      orderId: transaction.id,
      orderInfo: `Nap tien vi`,
      ipAddr: req.ip || '127.0.0.1',
    });

    const timeoutMinutes = this.configService.get<number>('DEPOSIT_TIMEOUT_MINUTES') || 5;

    return { 
      url, 
      transactionId: transaction.id,
      expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString()
    };
  }

  @Post('deposit/:id/cancel')
  async cancelDeposit(@Req() req, @Param('id') transactionId: string) {
    return this.walletService.cancelDeposit(req.user.id, transactionId);
  }
}
