import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BookingModule } from '../booking/booking.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [ConfigModule, forwardRef(() => BookingModule), forwardRef(() => WalletModule)],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule { }
