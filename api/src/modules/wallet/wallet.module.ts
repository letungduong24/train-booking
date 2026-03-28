import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AdminWalletController } from './admin-wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { BookingModule } from '../booking/booking.module';
import { BullModule } from '@nestjs/bullmq';
import { WalletProcessor } from './wallet.processor';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BookingModule),
    forwardRef(() => PaymentModule),
    BullModule.registerQueue({
      name: 'wallet-deposit',
    }),
  ],
  controllers: [WalletController, AdminWalletController],
  providers: [WalletService, WalletProcessor],
  exports: [WalletService],
})
export class WalletModule {}
