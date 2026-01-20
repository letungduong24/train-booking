import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FilterTripDto } from './dto/filter-trip.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/client';

@Injectable()
export class TripService {
    constructor(private prisma: PrismaService) { }

    async create(createTripDto: CreateTripDto) {
        // Validate route exists
        const route = await this.prisma.route.findUnique({
            where: { id: createTripDto.routeId }
        });
        if (!route) {
            throw new BadRequestException('Route không tồn tại');
        }

        // Validate train exists
        const train = await this.prisma.train.findUnique({
            where: { id: createTripDto.trainId }
        });
        if (!train) {
            throw new BadRequestException('Train không tồn tại');
        }

        // Calculate endTime
        const departureTime = new Date(createTripDto.departureTime);
        const durationMs = route.durationMinutes * 60 * 1000;
        const turnaroundMs = route.turnaroundMinutes * 60 * 1000;
        const endTime = new Date(departureTime.getTime() + durationMs + turnaroundMs);

        // Check for overlaps
        const existingTrip = await this.prisma.trip.findFirst({
            where: {
                trainId: createTripDto.trainId,
                status: { not: 'CANCELLED' },
                OR: [
                    {
                        // New trip starts during existing trip
                        departureTime: {
                            gte: departureTime,
                            lt: endTime
                        }
                    },
                    {
                        // New trip ends during existing trip
                        endTime: {
                            gt: departureTime,
                            lte: endTime
                        }
                    },
                    {
                        // New trip encompasses existing trip
                        departureTime: { lte: departureTime },
                        endTime: { gte: endTime }
                    }
                ]
            }
        });

        if (existingTrip) {
            throw new BadRequestException('Tàu này đã có chuyến đi khác trong khoảng thời gian này');
        }

        return this.prisma.trip.create({
            data: {
                routeId: createTripDto.routeId,
                trainId: createTripDto.trainId,
                departureTime,
                endTime,
                status: 'SCHEDULED',
            },
            include: {
                route: true,
                train: true,
            },
        });
    }

    async findAll(query: FilterTripDto = {}) {
        const { page = 1, limit = 10, search, routeId, trainId, departureTime, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TripWhereInput = {
            ...(search && {
                OR: [
                    { route: { name: { contains: search, mode: 'insensitive' } } },
                    { train: { name: { contains: search, mode: 'insensitive' } } },
                    { train: { code: { contains: search, mode: 'insensitive' } } },
                ],
            }),
            ...(routeId && { routeId }),
            ...(trainId && { trainId }),
            ...(departureTime && {
                departureTime: {
                    gte: new Date(departureTime),
                    lt: new Date(new Date(departureTime).getTime() + 24 * 60 * 60 * 1000)
                }
            }),
            ...(status && { status }),
        };

        const [data, total] = await Promise.all([
            this.prisma.trip.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [query.sort || 'departureTime']: query.order || 'desc'
                },
                include: {
                    route: true,
                    train: true,
                    _count: {
                        select: {
                            tickets: true
                        }
                    }
                },
            }),
            this.prisma.trip.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const trip = await this.prisma.trip.findUnique({
            where: { id },
            include: {
                route: {
                    include: {
                        stations: {
                            include: {
                                station: true
                            },
                            orderBy: {
                                index: 'asc'
                            }
                        }
                    }
                },
                train: {
                    include: {
                        coaches: {
                            include: {
                                template: true,
                                seats: true
                            },
                            orderBy: {
                                order: 'asc'
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        tickets: true
                    }
                }
            },
        });

        if (!trip) {
            throw new NotFoundException(`Trip #${id} không tồn tại`);
        }

        return trip;
    }

    async update(id: string, updateTripDto: UpdateTripDto) {
        // Check if trip exists
        await this.findOne(id);

        // Validate route if provided
        if (updateTripDto.routeId) {
            const route = await this.prisma.route.findUnique({
                where: { id: updateTripDto.routeId }
            });
            if (!route) {
                throw new BadRequestException('Route không tồn tại');
            }
        }

        // Validate train if provided
        if (updateTripDto.trainId) {
            const train = await this.prisma.train.findUnique({
                where: { id: updateTripDto.trainId }
            });
            if (!train) {
                throw new BadRequestException('Train không tồn tại');
            }
        }

        // Calculate new trip details
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) {
            throw new NotFoundException(`Trip #${id} không tồn tại`);
        }

        const routeId = updateTripDto.routeId || trip.routeId;
        const trainId = updateTripDto.trainId || trip.trainId;
        const departureTime = updateTripDto.departureTime ? new Date(updateTripDto.departureTime) : trip.departureTime;

        const route = await this.prisma.route.findUnique({ where: { id: routeId } });
        if (!route) {
            throw new BadRequestException('Route không tồn tại');
        }

        const durationMs = route.durationMinutes * 60 * 1000;
        const turnaroundMs = route.turnaroundMinutes * 60 * 1000;
        const endTime = new Date(departureTime.getTime() + durationMs + turnaroundMs);

        // Check for overlaps (excluding current trip)
        const existingTrip = await this.prisma.trip.findFirst({
            where: {
                id: { not: id },
                trainId: trainId,
                status: { not: 'CANCELLED' },
                OR: [
                    { departureTime: { gte: departureTime, lt: endTime } },
                    { endTime: { gt: departureTime, lte: endTime } },
                    { departureTime: { lte: departureTime }, endTime: { gte: endTime } }
                ]
            }
        });

        if (existingTrip) {
            throw new BadRequestException('Tàu này đã có chuyến đi khác trong khoảng thời gian này');
        }

        return this.prisma.trip.update({
            where: { id },
            data: {
                ...(updateTripDto.routeId && { routeId: updateTripDto.routeId }),
                ...(updateTripDto.trainId && { trainId: updateTripDto.trainId }),
                ...(updateTripDto.departureTime && { departureTime }),
                endTime, // Always update endTime
            },
            include: {
                route: true,
                train: true,
            },
        });
    }

    async remove(id: string) {
        // Check if trip exists
        await this.findOne(id);

        return this.prisma.trip.delete({
            where: { id },
        });
    }
}
