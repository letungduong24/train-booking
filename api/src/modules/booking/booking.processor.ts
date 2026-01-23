import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BookingService } from './booking.service';
import { Logger } from '@nestjs/common';

@Processor('booking')
export class BookingProcessor extends WorkerHost {
    private readonly logger = new Logger(BookingProcessor.name);

    constructor(private readonly bookingService: BookingService) {
        super();
    }

    async process(job: Job<{ bookingCode: string }>) {
        this.logger.log(`Processing booking expiration for code: ${job.data.bookingCode}`);
        try {
            await this.bookingService.handleBookingExpiration(job.data.bookingCode);
        } catch (error) {
            this.logger.error(`Failed to process booking expiration: ${error.message}`);
            // Don't rethrow if it's a known handled case to avoid retry loops? 
            // BullMQ retries by default. If it fails due to DB error, maybe retry. 
            // If booking not found, don't retry.
            // For now, let's just log.
        }
    }
}
