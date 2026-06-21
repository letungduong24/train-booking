import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TripModule } from '../trip/trip.module';
import { TripDelayReportsController } from './trip-delay-reports.controller';
import { TripDelayReportsService } from './trip-delay-reports.service';

@Module({
  imports: [PrismaModule, TripModule],
  controllers: [TripDelayReportsController],
  providers: [TripDelayReportsService],
})
export class TripDelayReportsModule {}
