import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { StationModule } from '../station/station.module';
import { TripModule } from '../trip/trip.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [StationModule, TripModule, PrismaModule, AuthModule],
  controllers: [ChatbotController],
})
export class ChatbotModule { }
