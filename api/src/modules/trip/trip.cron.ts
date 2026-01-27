import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TripStatus } from '../../generated/client';
import dayjs from 'dayjs';

@Injectable()
export class TripCron {
    private readonly logger = new Logger(TripCron.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        const intervalMinutes = this.configService.get<number>('TRIP_STATUS_UPDATE_INTERVAL_MINUTES', 1);
        this.logger.log(`Trip status auto-update will run every ${intervalMinutes} minute(s)`);
    }

    /**
     * Auto update trip status every minute (configurable via TRIP_STATUS_UPDATE_INTERVAL_MINUTES env)
     * SCHEDULED → IN_PROGRESS when actual departure time arrives
     * IN_PROGRESS → COMPLETED when actual end time arrives
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async autoUpdateTripStatus() {
        const now = new Date();
        this.logger.log('Running trip status auto-update...');

        try {
            // Update SCHEDULED → IN_PROGRESS
            const tripsToStart = await this.prisma.trip.findMany({
                where: {
                    status: TripStatus.SCHEDULED,
                },
                select: {
                    id: true,
                    departureTime: true,
                    departureDelayMinutes: true,
                },
            });

            let startedCount = 0;
            for (const trip of tripsToStart) {
                // Calculate actual departure time
                const actualDeparture = dayjs(trip.departureTime)
                    .add(trip.departureDelayMinutes, 'minute')
                    .toDate();

                // If actual departure time has passed
                if (actualDeparture <= now) {
                    await this.prisma.trip.update({
                        where: { id: trip.id },
                        data: {
                            status: TripStatus.IN_PROGRESS,
                            departureDelayMinutes: 0, // Reset departure delay
                        },
                    });
                    startedCount++;
                }
            }

            if (startedCount > 0) {
                this.logger.log(`Started ${startedCount} trips (SCHEDULED → IN_PROGRESS)`);
            }

            // Update IN_PROGRESS → COMPLETED
            const tripsToComplete = await this.prisma.trip.findMany({
                where: {
                    status: TripStatus.IN_PROGRESS,
                },
                select: {
                    id: true,
                    endTime: true,
                    departureDelayMinutes: true,
                    arrivalDelayMinutes: true,
                },
            });

            let completedCount = 0;
            for (const trip of tripsToComplete) {
                // Calculate actual end time
                // endTime + departureDelay (vì đã delay khởi hành) + arrivalDelay (delay thêm khi đang chạy)
                const actualEnd = dayjs(trip.endTime)
                    .add(trip.departureDelayMinutes, 'minute')
                    .add(trip.arrivalDelayMinutes, 'minute')
                    .toDate();

                // If actual end time has passed
                if (actualEnd <= now) {
                    await this.prisma.trip.update({
                        where: { id: trip.id },
                        data: {
                            status: TripStatus.COMPLETED,
                            departureDelayMinutes: 0, // Reset all delays
                            arrivalDelayMinutes: 0,
                        },
                    });
                    completedCount++;
                }
            }

            if (completedCount > 0) {
                this.logger.log(`Completed ${completedCount} trips (IN_PROGRESS → COMPLETED)`);
            }

            if (startedCount === 0 && completedCount === 0) {
                this.logger.debug('No trips to update');
            }
        } catch (error) {
            this.logger.error('Failed to auto-update trip status', error);
        }
    }
}
