import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from './modules/redis/redis.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TrainModule } from './modules/train/train.module';
import { StationModule } from './modules/station/station.module';
import { RouteModule } from './modules/route/route.module';
import { CoachesModule } from './modules/coaches/coaches.module';
import { CoachTemplateModule } from './modules/coach-template/coach-template.module';
import { SeatsModule } from './modules/seats/seats.module';
import { TripModule } from './modules/trip/trip.module';
import { PaymentModule } from './modules/payment/payment.module';
import { BookingModule } from './modules/booking/booking.module';
import { PassengerGroupModule } from './modules/passenger-group/passenger-group.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting - 10 requests per minute
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 10, // 10 requests
    }]),
    PrismaModule,
    AuthModule,
    TrainModule,
    StationModule,
    RouteModule,
    CoachesModule,
    CoachTemplateModule,
    SeatsModule,
    TripModule,
    PaymentModule,
    BookingModule,
    PassengerGroupModule,
    RedisModule,
    WalletModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get('REDIS_URL'),
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
