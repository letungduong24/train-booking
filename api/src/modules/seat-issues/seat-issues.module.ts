import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { BookingModule } from '../booking/booking.module';
import { SeatIssuesController } from './seat-issues.controller';
import { SeatIssuesService } from './seat-issues.service';
import { SeatIssuesCron } from './seat-issues.cron';

@Module({
  imports: [PrismaModule, MailModule, BookingModule],
  controllers: [SeatIssuesController],
  providers: [SeatIssuesService, SeatIssuesCron],
  exports: [SeatIssuesService],
})
export class SeatIssuesModule {}
