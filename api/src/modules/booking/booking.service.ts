import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { PricingService } from '../pricing/pricing.service';
import { InitBookingDto } from './dto/init-booking.dto';
import { UpdateBookingPassengersDto } from './dto/update-booking-passengers.dto';
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

        // 1. Kiểm tra thông tin Chuyến tàu & Tuyến đường
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                route: {
                    include: {
                        stations: {
                            include: { station: true }
                        },
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
            throw new BadRequestException('Không tìm thấy chuyến tàu');
        }

        const fromStation = trip.route.stations.find(s => s.stationId === fromStationId);
        const toStation = trip.route.stations.find(s => s.stationId === toStationId);

        if (!fromStation || !toStation) {
            throw new BadRequestException('Ga đến hoặc ga đi không hợp lệ');
        }

        // 2. Kiểm tra Hành khách & Tính giá vé (áp dụng giảm giá)
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
            throw new BadRequestException('Một số ghế ngồi không tìm thấy');
        }

        // Lấy danh sách đối tượng hành khách
        const passengerGroupIds = passengers.map(p => p.passengerGroupId);
        const passengerGroups = await this.prisma.passengerGroup.findMany({
            where: {
                id: { in: passengerGroupIds },
            },
        });

        if (passengerGroups.length !== passengerGroupIds.length) {
            throw new BadRequestException('Một số đối tượng hành khách không hợp lệ');
        }

        // Kiểm tra CCCD và độ tuổi hành khách
        for (const passenger of passengers) {
            const group = passengerGroups.find(g => g.id === passenger.passengerGroupId);
            if (!group) continue;

            // Yêu cầu CCCD với hành khách không phải trẻ em
            if (group.code !== 'CHILD' && (!passenger.passengerId || passenger.passengerId === 'N/A')) {
                throw new BadRequestException(`Yêu cầu CCCD đối với ${group.name}`);
            }

            // Kiểm tra định dạng CCCD và độ tuổi (bỏ qua nếu là trẻ em)
            if (passenger.passengerId && passenger.passengerId !== 'N/A') {
                // Kiểm tra định dạng CCCD
                const cccdInfo = validateCCCD(passenger.passengerId);
                if (!cccdInfo.isValid) {
                    throw new BadRequestException(`CCCD không hợp lệ cho hành khách ${passenger.passengerName}: ${cccdInfo.error}`);
                }

                // Kiểm tra độ tuổi phù hợp với đối tượng
                const ageValidation = validateCCCDAgeForGroup(
                    passenger.passengerId,
                    group.minAge,
                    group.maxAge
                );

                if (!ageValidation.isValid) {
                    throw new BadRequestException(
                        `Tuổi không phù hợp với loại vé ${passenger.passengerName}: ${ageValidation.error}. ` +
                        `Tuổi thực: ${ageValidation.age}, Loại vé: ${group.name} (${group.minAge ?? 'không min'}-${group.maxAge ?? 'không max'})`
                    );
                }

                this.logger.log(`Đã xác thực CCCD cho ${passenger.passengerName}: Tuổi ${ageValidation.age}, Loại: ${group.name}`);
            }
        }

        let totalPrice = 0;
        const ticketInputs: any[] = [];

        for (const passenger of passengers) {
            const seat = seats.find(s => s.id === passenger.seatId);
            if (!seat) {
                throw new BadRequestException(`Ghế ${passenger.seatId} không tìm thấy`);
            }

            const group = passengerGroups.find(g => g.id === passenger.passengerGroupId);
            if (!group) {
                throw new BadRequestException(`Loại hành khách ${passenger.passengerGroupId} không tìm thấy`);
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

        // 3. Tạo Đơn đặt chỗ (lưu metadata, chưa tạo vé chi tiết)
        const bookingCode = `VNR-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000)}`;

        const booking = await this.prisma.booking.create({
            data: {
                code: bookingCode,
                userId: userId,
                tripId: tripId,
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

        // 4. Tạo URL thanh toán
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
        // Tìm đơn đặt chỗ
        const booking = await this.prisma.booking.findUnique({
            where: { code: bookingCode },
        });

        if (!booking) {
            throw new BadRequestException('Không tìm thấy đơn đặt chỗ');
        }

        if (booking.status === 'PAID') {
            this.logger.warn(`Đơn đặt chỗ ${bookingCode} đã được thanh toán`);
            return booking;
        }

        if (!booking.metadata) {
            throw new BadRequestException('Thông tin metadata của đơn hàng bị thiếu');
        }

        const metadata = booking.metadata as any;

        // Tạo danh sách vé từ metadata
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

        // Cập nhật đơn hàng: tạo vé + chuyển trạng thái + xóa metadata
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

        this.logger.log(`Đã xác nhận đơn hàng ${bookingCode} với ${tickets.length} vé`);
        return updatedBooking;
    }

    async updateBookingStatus(code: string, status: string) {
        // Triển khai logic cập nhật trạng thái
    }

    async getMyBookings(userId: string) {
        return this.prisma.booking.findMany({
            where: { userId },
            include: {
                trip: {
                    include: {
                        route: true,
                        train: true,
                    },
                },
                tickets: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async initBooking(userId: string | null, dto: InitBookingDto, ipAddr: string) {
        const { tripId, seatIds, fromStationId, toStationId } = dto;

        // 1. Kiểm tra thông tin Chuyến tàu & Tuyến đường
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                route: {
                    include: {
                        stations: {
                            include: { station: true }
                        },
                    }
                },
            }
        });

        if (!trip) {
            throw new BadRequestException('Không tìm thấy chuyến tàu');
        }

        const fromStation = trip.route.stations.find(s => s.stationId === fromStationId);
        const toStation = trip.route.stations.find(s => s.stationId === toStationId);

        if (!fromStation || !toStation) {
            throw new BadRequestException('Ga đến hoặc ga đi không hợp lệ');
        }

        // 2. Validate Seats
        const seats = await this.prisma.seat.findMany({
            where: {
                id: { in: seatIds },
                // status: 'AVAILABLE' // Có thể check status nếu cần strict
            }
        });

        if (seats.length !== seatIds.length) {
            throw new BadRequestException('Một số ghế không hợp lệ');
        }

        // 3. Create Booking (PENDING, tmp price = 0)
        const bookingCode = `VNR-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000)}`;

        const booking = await this.prisma.booking.create({
            data: {
                code: bookingCode,
                userId: userId,
                tripId: tripId,
                totalPrice: 0, // Giá tạm tính là 0
                status: 'PENDING',
                metadata: {
                    tripId,
                    fromStationId,
                    toStationId,
                    seatIds,
                    // Chưa có passengers
                },
            }
        });

        return {
            bookingId: booking.id,
            bookingCode: booking.code,
        };
    }

    async updateBookingPassengers(code: string, dto: UpdateBookingPassengersDto, ipAddr: string) {
        const { passengers } = dto;

        const booking = await this.prisma.booking.findUnique({
            where: { code },
            include: {
                trip: {
                    include: {
                        route: {
                            include: {
                                stations: {
                                    include: { station: true }
                                },
                            },
                        },
                        train: {
                            include: {
                                coaches: {
                                    include: { template: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!booking) {
            throw new BadRequestException('Bản ghi đặt chỗ không tồn tại');
        }

        if (booking.status !== 'PENDING') {
            throw new BadRequestException('Đơn hàng không ở trạng thái chờ xử lý');
        }

        const metadata = booking.metadata as any;
        const fromStationId = metadata.fromStationId;
        const toStationId = metadata.toStationId;
        const trip = booking.trip;

        const fromStation = (trip.route as any).stations.find((s: any) => s.stationId === fromStationId) ||
            await this.prisma.routeStation.findFirst({ where: { routeId: trip.routeId, stationId: fromStationId } });
        const toStation = await this.prisma.routeStation.findFirst({ where: { routeId: trip.routeId, stationId: toStationId } });

        if (!fromStation || !toStation) throw new BadRequestException('Ga không hợp lệ');

        // Validate Passengers & Calculate Prices
        const seatIds = passengers.map(p => p.seatId);
        const seats = await this.prisma.seat.findMany({
            where: { id: { in: seatIds } },
            include: { coach: { include: { template: true } } }
        });

        if (seats.length !== seatIds.length) {
            throw new BadRequestException('Ghế không hợp lệ');
        }

        const passengerGroups = await this.prisma.passengerGroup.findMany();

        // Validate logic (CCCD, Age) - Reuse logic from createBooking but optimized
        for (const p of passengers) {
            const group = passengerGroups.find(g => g.id === p.passengerGroupId);
            if (!group) throw new BadRequestException(`Đối tượng ${p.passengerGroupId} không tồn tại`);

            const passengerId = p.passengerId;
            if (group.code !== 'CHILD' && (!passengerId || passengerId === 'N/A')) {
                throw new BadRequestException(`Yêu cầu số giấy tờ tùy thân hợp lệ cho ${group.name}`);
            }
            if (passengerId && passengerId !== 'N/A') {
                const ageValidation = validateCCCDAgeForGroup(passengerId, group.minAge, group.maxAge);
                if (!ageValidation.isValid) throw new BadRequestException(`Độ tuổi không phù hợp với loại vé: ${ageValidation.error}`);
            }
        }

        let totalPrice = 0;
        const ticketInputs: any[] = [];

        for (const passenger of passengers) {
            const seat = seats.find(s => s.id === passenger.seatId);
            const group = passengerGroups.find(g => g.id === passenger.passengerGroupId);
            if (!seat || !group) continue;

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
                price,
                ...passenger
            });
        }

        // Update Booking
        await this.prisma.booking.update({
            where: { code },
            data: {
                totalPrice,
                metadata: {
                    ...metadata,
                    passengers: ticketInputs.map(t => ({
                        seatId: t.seatId,
                        price: t.price,
                        passengerName: t.passengerName,
                        passengerId: t.passengerId,
                        passengerGroupId: t.passengerGroupId,
                        fromStationIndex: fromStation.index,
                        toStationIndex: toStation.index,
                    })),
                }
            }
        });

        // Generate Payment URL
        const paymentUrl = this.paymentService.createPaymentUrl({
            amount: totalPrice,
            orderId: booking.code,
            orderInfo: `Thanh toan ve tau ${booking.code}`,
            ipAddr: ipAddr,
        });

        return {
            bookingCode: booking.code,
            paymentUrl,
            totalPrice
        };
    }

    async getBookingByCode(code: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { code },
            include: {
                trip: {
                    include: {
                        route: {
                            include: {
                                stations: {
                                    include: { station: true }
                                },
                            },
                        },
                        train: true,
                    },
                },
            },
        });

        if (!booking) {
            throw new BadRequestException('Không tìm thấy đơn hàng');
        }

        // Enrich with seat details if PENDING
        if (booking.status === 'PENDING' && booking.metadata) {
            const metadata = booking.metadata as any;
            const seatIds = metadata.seatIds as string[] || [];
            if (seatIds.length > 0) {
                const seats = await this.prisma.seat.findMany({
                    where: { id: { in: seatIds } },
                    include: { coach: { include: { template: true } } }
                });

                const enrichedSeats: { id: string; name: string; price: number }[] = [];

                // Need station info for pricing
                const fromStationId = metadata.fromStationId;
                const toStationId = metadata.toStationId;
                const trip = booking.trip;

                const fromStation = (trip.route as any).stations.find((s: any) => s.stationId === fromStationId) ||
                    await this.prisma.routeStation.findFirst({ where: { routeId: trip.routeId, stationId: fromStationId } });
                const toStation = await this.prisma.routeStation.findFirst({ where: { routeId: trip.routeId, stationId: toStationId } });

                if (fromStation && toStation) {
                    for (const seat of seats) {
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
                            discountRate: 0, // Base price
                        });
                        enrichedSeats.push({
                            id: seat.id,
                            name: `${seat.coach.name}-${seat.name}`, // Standardized name
                            price: price,
                            // Add coachId if needed for navigation?
                        });
                    }
                }

                return {
                    ...booking,
                    metadata: {
                        ...metadata,
                        seats: enrichedSeats
                    }
                };
            }
        }

        return booking;
    }
}
