import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TripDelayService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Set departure delay for SCHEDULED trips
     */
    async setDepartureDelay(tripId: string, minutes: number) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { id: true, status: true },
        });

        if (!trip) {
            throw new NotFoundException(`Trip #${tripId} không tồn tại`);
        }

        if (trip.status !== 'SCHEDULED') {
            throw new BadRequestException('Chỉ có thể set departure delay cho chuyến SCHEDULED');
        }

        return this.prisma.trip.update({
            where: { id: tripId },
            data: { departureDelayMinutes: minutes },
            include: {
                route: true,
                train: true,
            },
        });
    }

    /**
     * Set arrival delay for IN_PROGRESS trips
     */
    async setArrivalDelay(tripId: string, minutes: number) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { id: true, status: true },
        });

        if (!trip) {
            throw new NotFoundException(`Trip #${tripId} không tồn tại`);
        }

        if (trip.status !== 'IN_PROGRESS') {
            throw new BadRequestException('Chỉ có thể set arrival delay cho chuyến IN_PROGRESS');
        }

        return this.prisma.trip.update({
            where: { id: tripId },
            data: { arrivalDelayMinutes: minutes },
            include: {
                route: true,
                train: true,
            },
        });
    }
}
