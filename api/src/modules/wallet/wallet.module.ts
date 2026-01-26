import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AdminWalletController } from './admin-wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { BookingModule } from '../booking/booking.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => BookingModule),
        forwardRef(() => PaymentModule),
    ],
    controllers: [WalletController, AdminWalletController],
    providers: [WalletService],
    exports: [WalletService],
})
export class WalletModule { }
