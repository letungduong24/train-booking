import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WalletService } from './wallet.service';
import { Logger } from '@nestjs/common';

@Processor('wallet-deposit')
export class WalletProcessor extends WorkerHost {
  private readonly logger = new Logger(WalletProcessor.name);

  constructor(private readonly walletService: WalletService) {
    super();
  }

  async process(job: Job<{ transactionId: string }>) {
    this.logger.log(
      `Processing deposit expiration for transaction: ${job.data.transactionId}`,
    );
    try {
      await this.walletService.handleDepositExpiration(job.data.transactionId);
    } catch (error) {
      this.logger.error(
        `Failed to process deposit expiration: ${error.message}`,
      );
    }
  }
}
