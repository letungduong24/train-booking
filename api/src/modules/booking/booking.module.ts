import { Module, forwardRef } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { PricingModule } from '../pricing/pricing.module';
import { BullModule } from '@nestjs/bullmq';
import { BookingProcessor } from './booking.processor';
import { BookingGateway } from './booking.gateway';

import { WalletModule } from '../wallet/wallet.module';
import { TripModule } from '../trip/trip.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => PaymentModule),
        forwardRef(() => WalletModule),
        PricingModule,
        TripModule,
        BullModule.registerQueue({
            name: 'booking',
        }),
    ],
    controllers: [BookingController],
    providers: [BookingService, BookingProcessor, BookingGateway],
    exports: [BookingService],
})
export class BookingModule { }
