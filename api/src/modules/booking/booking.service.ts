import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import dayjs from 'dayjs';
import { validateCCCD, validateCCCDAgeForGroup } from '../../common/utils/cccd.util';

@Injectable()
export class BookingService {
    private readonly logger = new Logger(BookingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentService: PaymentService,
        private readonly pricingService: PricingService,
    ) { }

    async createBooking(userId: string | null, dto: CreateBookingDto, ipAddr: string) {
        const { tripId, passengers, fromStationId, toStationId } = dto;

        // 1. Validate Trip & Route
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                route: {
                    include: {
                        stations: true,
                    }
                },
                train: {
                    include: {
                        coaches: {
                            include: {
                                template: true,
                            }
                        }
                    }
                }
            }
        });

        if (!trip) {
            throw new BadRequestException('Trip not found');
        }

        const fromStation = trip.route.stations.find(s => s.stationId === fromStationId);
        const toStation = trip.route.stations.find(s => s.stationId === toStationId);

        if (!fromStation || !toStation) {
            throw new BadRequestException('Invalid stations for this route');
        }

        // 2. Validate Passengers & Calculate Prices with Discounts
        const seatIds = passengers.map(p => p.seatId);
        const seats = await this.prisma.seat.findMany({
            where: {
                id: { in: seatIds },
            },
            include: {
                coach: {
                    include: {
                        template: true,
                    }
                }
            }
        });

        if (seats.length !== seatIds.length) {
            throw new BadRequestException('Some seats not found');
        }

        // Get all passenger groups
        const passengerGroupIds = passengers.map(p => p.passengerGroupId);
        const passengerGroups = await this.prisma.passengerGroup.findMany({
            where: {
                id: { in: passengerGroupIds },
            },
        });

        if (passengerGroups.length !== passengerGroupIds.length) {
            throw new BadRequestException('Some passenger groups not found');
        }

        // Validate CCCD for non-children and check age
        for (const passenger of passengers) {
            const group = passengerGroups.find(g => g.id === passenger.passengerGroupId);
            if (!group) continue;

            // CCCD required for non-children
            if (group.code !== 'CHILD' && (!passenger.passengerId || passenger.passengerId === 'N/A')) {
                throw new BadRequestException(`CCCD is required for ${group.name}`);
            }

            // Validate CCCD format and age (skip for children with N/A)
            if (passenger.passengerId && passenger.passengerId !== 'N/A') {
                // Validate CCCD format
                const cccdInfo = validateCCCD(passenger.passengerId);
                if (!cccdInfo.isValid) {
                    throw new BadRequestException(`Invalid CCCD for ${passenger.passengerName}: ${cccdInfo.error}`);
                }

                // Validate age matches passenger group
                const ageValidation = validateCCCDAgeForGroup(
                    passenger.passengerId,
                    group.minAge,
                    group.maxAge
                );

                if (!ageValidation.isValid) {
                    throw new BadRequestException(
                        `CCCD age mismatch for ${passenger.passengerName}: ${ageValidation.error}. ` +
                        `Detected age: ${ageValidation.age}, Group: ${group.name} (${group.minAge ?? 'no min'}-${group.maxAge ?? 'no max'})`
                    );
                }

                this.logger.log(`Validated CCCD for ${passenger.passengerName}: Age ${ageValidation.age}, Group: ${group.name}`);
            }
        }

        let totalPrice = 0;
        const ticketInputs: any[] = [];

        for (const passenger of passengers) {
            const seat = seats.find(s => s.id === passenger.seatId);
            if (!seat) {
                throw new BadRequestException(`Seat ${passenger.seatId} not found`);
            }

            const group = passengerGroups.find(g => g.id === passenger.passengerGroupId);
            if (!group) {
                throw new BadRequestException(`Passenger group ${passenger.passengerGroupId} not found`);
            }

            const price = this.pricingService.calculateSeatPrice({
                route: {
                    basePricePerKm: trip.route.basePricePerKm,
                    stationFee: trip.route.stationFee,
                },
                coachTemplate: {
                    coachMultiplier: seat.coach.template.coachMultiplier,
                    tierMultipliers: seat.coach.template.tierMultipliers,
                },
                seatTier: seat.tier,
                fromStationDistance: fromStation.distanceFromStart,
                toStationDistance: toStation.distanceFromStart,
                discountRate: group.discountRate,
            });

            totalPrice += price;
            ticketInputs.push({
                seatId: seat.id,
                tripId: tripId,
                price: price,
                passengerName: passenger.passengerName,
                passengerId: passenger.passengerId || 'N/A',
                passengerGroupId: passenger.passengerGroupId,
                fromStationIndex: fromStation.index,
                toStationIndex: toStation.index,
            });
        }

        // 3. Create Booking with metadata (no tickets yet)
        const bookingCode = `VNR-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000)}`;

        const booking = await this.prisma.booking.create({
            data: {
                code: bookingCode,
                userId: userId,
                totalPrice: totalPrice,
                status: 'PENDING',
                metadata: {
                    tripId,
                    fromStationId,
                    toStationId,
                    passengers: ticketInputs.map(t => ({
                        seatId: t.seatId,
                        price: t.price,
                        passengerName: t.passengerName,
                        passengerId: t.passengerId,
                        passengerGroupId: t.passengerGroupId,
                        fromStationIndex: t.fromStationIndex,
                        toStationIndex: t.toStationIndex,
                    })),
                },
            }
        });

        // 4. Generate Payment URL
        const paymentUrl = this.paymentService.createPaymentUrl({
            amount: totalPrice,
            orderId: booking.code,
            orderInfo: `Thanh toan ve tau ${booking.code}`,
            ipAddr: ipAddr,
        });

        return {
            bookingId: booking.id,
            bookingCode: booking.code,
            paymentUrl,
        };
    }

    async confirmBooking(bookingCode: string) {
        // Find booking
        const booking = await this.prisma.booking.findUnique({
            where: { code: bookingCode },
        });

        if (!booking) {
            throw new BadRequestException('Booking not found');
        }

        if (booking.status === 'PAID') {
            this.logger.warn(`Booking ${bookingCode} already confirmed`);
            return booking;
        }

        if (!booking.metadata) {
            throw new BadRequestException('Booking metadata missing');
        }

        const metadata = booking.metadata as any;

        // Create tickets from metadata
        const tickets = metadata.passengers.map((p: any) => ({
            seatId: p.seatId,
            tripId: metadata.tripId,
            price: p.price,
            passengerName: p.passengerName,
            passengerId: p.passengerId,
            passengerGroupId: p.passengerGroupId,
            fromStationIndex: p.fromStationIndex,
            toStationIndex: p.toStationIndex,
        }));

        // Update booking: create tickets + update status + clear metadata
        const updatedBooking = await this.prisma.booking.update({
            where: { code: bookingCode },
            data: {
                status: 'PAID',
                metadata: Prisma.JsonNull,
                tickets: {
                    create: tickets,
                },
            },
            include: {
                tickets: true,
            },
        });

        this.logger.log(`Booking ${bookingCode} confirmed with ${tickets.length} tickets`);
        return updatedBooking;
    }

    async updateBookingStatus(code: string, status: string) {
        // Implementation for status update
    }
}
