import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { TripCron } from './trip.cron';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TripController],
    providers: [TripService, TripCron],
})
export class TripModule { }
