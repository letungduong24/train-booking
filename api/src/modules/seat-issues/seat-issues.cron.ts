import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SeatIssueStatus } from '../../generated/client';
import { SeatIssuesService } from './seat-issues.service';

@Injectable()
export class SeatIssuesCron {
  private readonly logger = new Logger(SeatIssuesCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seatIssuesService: SeatIssuesService,
  ) {}

  /**
   * Run every 10 minutes to scan for expired seat replacement tokens (24 hours limit).
   * Expired requests are cancelled and refunded to the customer's wallet.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async autoResolveExpiredTokens() {
    const now = new Date();
    this.logger.log('Running expired seat issues token scan...');

    try {
      const expiredReports = await this.prisma.seatIssueReport.findMany({
        where: {
          status: SeatIssueStatus.WAITING_CUSTOMER_CONFIRMATION,
          tokenExpires: { lt: now },
        },
        include: {
          seat: true,
          proposedSeat: {
            include: {
              coach: true,
            },
          },
        },
      });

      if (expiredReports.length === 0) {
        this.logger.debug('No expired seat replacement tokens found');
        return;
      }

      this.logger.log(`Found ${expiredReports.length} expired seat replacement tokens to refund`);

      for (const report of expiredReports) {
        await this.seatIssuesService.refundExpiredReplacement(report.id);
        this.logger.log(`Expired seat issue report #${report.id} was cancelled and refunded`);
      }
    } catch (error) {
      this.logger.error('Failed to run auto-resolve expired seat tokens job', error);
    }
  }
}
