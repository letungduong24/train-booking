import { BadRequestException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { Prisma } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { PricingService } from '../pricing/pricing.service';
import { InitBookingDto } from './dto/init-booking.dto';
import { UpdateBookingPassengersDto } from './dto/update-booking-passengers.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';
import { BookingMetadata } from './interfaces/booking-metadata.interface';
import dayjs from 'dayjs';
import { validateCCCD, validateCCCDAgeForGroup } from '../../common/utils/cccd.util';

import { BookingGateway } from './booking.gateway';

@Injectable()
export class BookingService {
    private readonly logger = new Logger(BookingService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => PaymentService))
        private readonly paymentService: PaymentService,
        private readonly pricingService: PricingService,
        private readonly configService: ConfigService,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
        @InjectQueue('booking') private readonly bookingQueue: Queue,
        private readonly bookingGateway: BookingGateway,
        @Inject(forwardRef(() => WalletService))
        private readonly walletService: WalletService,
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
        await this.validatePassengers(passengers, passengerGroups);

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

        // Kiểm tra race condition: ghế đã bị người khác mua chưa?
        const tripId = metadata.tripId;
        const seatIds = tickets.map(t => t.seatId);

        const existingTickets = await this.prisma.ticket.findMany({
            where: {
                tripId: tripId,
                seatId: { in: seatIds }
            }
        });

        if (existingTickets.length > 0) {
            this.logger.error(`Race condition detected for Booking ${bookingCode}. Seats already taken.`);

            // Hoàn tiền nếu thanh toán bằng ví
            if (booking.userId) {
                try {
                    await this.walletService.refundToWallet(
                        booking.userId,
                        booking.totalPrice,
                        bookingCode,
                        'Hoàn tiền tự động do hết ghế (Lỗi đồng bộ)'
                    );
                    this.logger.log(`Refunded ${booking.totalPrice} to wallet for user ${booking.userId}`);
                } catch (refundError) {
                    this.logger.error(`Failed to refund to wallet for booking ${bookingCode}`, refundError);
                }
            }

            // Cập nhật trạng thái để Admin biết
            await this.prisma.booking.update({
                where: { code: bookingCode },
                data: {
                    status: 'PAYMENT_FAILED',
                }
            });

            throw new BadRequestException('Ghế đã được đặt bởi người khác. Tiền đã được hoàn về ví của bạn.');
        }

        // Kiểm tra Redis lock - Ưu tiên người đang lock hiện tại
        const lockKeys = seatIds.map((id: string) => `lock:seat:${tripId}:${id}`);
        const locks = await Promise.all(lockKeys.map((key: string) => this.redis.get(key)));

        const lockedByOthers = locks.some((lock, index) => {
            if (!lock) return false; // Không có lock
            try {
                // The lock value is just the bookingCode string, not a JSON object.
                // The `initBooking` method sets `await this.redis.set(key, bookingCode, 'EX', lockTimeSec, 'NX');`
                // So we should compare directly with the bookingCode.
                return lock !== bookingCode; // Lock bởi booking khác
            } catch {
                return false; // Should not happen if lock is just a string
            }
        });

        if (lockedByOthers) {
            this.logger.error(`Booking ${bookingCode} rejected: Seats are locked by another active booking`);

            // Hoàn tiền nếu thanh toán bằng ví
            if (booking.userId) {
                try {
                    await this.walletService.refundToWallet(
                        booking.userId,
                        booking.totalPrice,
                        bookingCode,
                        'Hoàn tiền do ghế đang được giữ bởi người khác'
                    );
                    this.logger.log(`Refunded ${booking.totalPrice} to wallet for user ${booking.userId}`);
                } catch (refundError) {
                    this.logger.error(`Failed to refund to wallet for booking ${bookingCode}`, refundError);
                }
            }

            // Cập nhật trạng thái
            await this.prisma.booking.update({
                where: { code: bookingCode },
                data: {
                    status: 'PAYMENT_FAILED',
                }
            });

            throw new BadRequestException('Ghế đang được giữ bởi người khác. Tiền đã được hoàn về ví của bạn.');
        }

        // Tạo vé và cập nhật trạng thái booking
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
                tickets: {
                    include: {
                        seat: {
                            include: {
                                coach: true
                            }
                        }
                    }
                },
            },
        });

        // Xóa lock Redis và thông báo release
        if (metadata.tripId && metadata.passengers) {
            const tripId = metadata.tripId;
            const seatIds = metadata.passengers.map((p: any) => p.seatId);

            // Xóa key trong Redis
            const locks = seatIds.map((id: string) => `lock:seat:${tripId}:${id}`);
            if (locks.length > 0) {
                await Promise.all(locks.map((key: string) => this.redis.del(key)));
            }

            // Emit sự kiện để các client khác bỏ màu vàng (chuyển sang đỏ nếu logic FE/BE đã sync status BOOKED, hoặc xanh tạm thời)
            // Tốt nhất là các client nên trigger fetch lại seats khi nhận event này hoặc một event `seats.booked` riêng.
            // Nhưng hiện tại để fix lỗi "bị ghi đè locked" thì ta release lock là được.
            this.bookingGateway.emitSeatsReleased(tripId, seatIds);
            this.bookingGateway.emitSeatsBooked(tripId, seatIds);
        }

        this.logger.log(`Đã xác nhận đơn hàng ${bookingCode} với ${tickets.length} vé`);
        return updatedBooking;
    }



    async getMyBookings(userId: string, query: FilterBookingDto) {
        const { page = 1, limit = 10, skip, take, search, status, sort, order } = query;

        const where: Prisma.BookingWhereInput = {
            userId,
            ...(status && { status }),
            ...(search && {
                OR: [
                    { code: { contains: search, mode: 'insensitive' } },
                    {
                        trip: {
                            train: {
                                name: { contains: search, mode: 'insensitive' }
                            }
                        }
                    },
                    {
                        trip: {
                            route: {
                                name: { contains: search, mode: 'insensitive' }
                            }
                        }
                    }
                ]
            }),
        };

        const [data, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                skip,
                take,
                include: {
                    trip: {
                        include: {
                            route: true,
                            train: true,
                        },
                    },
                    tickets: true,
                },
                orderBy: {
                    [sort || 'createdAt']: order || 'desc',
                },
            }),
            this.prisma.booking.count({ where }),
        ]);

        const lockTimeMin = this.configService.get<number>('BOOKING_LOCK_TIME_MINUTES') || 10;

        const enrichedData = data.map(booking => ({
            ...booking,
            expiresAt: dayjs(booking.createdAt).add(lockTimeMin, 'minute').toDate()
        }));

        return {
            data: enrichedData,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async initBooking(userId: string | null, dto: InitBookingDto, ipAddr: string) {
        const { tripId, seatIds, fromStationId, toStationId } = dto;

        // 0. Policy Guard
        if (userId) {
            await this.validateBookingPolicy(userId, tripId, seatIds.length);
        }

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
            }
        });

        if (seats.length !== seatIds.length) {
            throw new BadRequestException('Một số ghế không hợp lệ');
        }

        // 3. Redis Lock Check (Optimistic Locking)
        const bookingCode = `VNR-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000)}`;
        const acquiredLocks: string[] = [];

        const lockTimeMin = this.configService.get<number>('BOOKING_LOCK_TIME_MINUTES') || 10;
        const lockTimeSec = lockTimeMin * 60;
        const lockTimeMs = lockTimeMin * 60 * 1000;

        try {
            for (const seatId of seatIds) {
                const key = `lock:seat:${tripId}:${seatId}`;
                // NX: Set if Not Exists, EX: Expire in seconds (600s = 10m)
                const result = await this.redis.set(key, bookingCode, 'EX', lockTimeSec, 'NX');

                if (result !== 'OK') {
                    // Lock failed, meaning seat is taken
                    // Instead of throwing immediately, we want to know ALL failed seats to report meaningful names
                    // But for simplicity/performance in optimistic lock, failing on first one is fine, just need its name.
                    const lockedSeat = await this.prisma.seat.findUnique({
                        where: { id: seatId },
                        include: { coach: true }
                    });
                    const seatName = lockedSeat ? `${lockedSeat.name} (Toa ${lockedSeat.coach.name})` : seatId;
                    throw new BadRequestException(`Ghế ${seatName} đang được giữ bởi người khác. Vui lòng thử lại sau.`);
                }
                acquiredLocks.push(key);
            }

            // 4. Create Booking (PENDING, tmp price = 0)
            const booking = await this.prisma.booking.create({
                data: {
                    code: bookingCode,
                    userId: userId,
                    tripId: tripId,
                    totalPrice: 0,
                    status: 'PENDING',
                    metadata: {
                        tripId,
                        fromStationId,
                        toStationId,
                        seatIds,
                    },
                }
            });

            // 5. Add to Expiration Queue
            await this.bookingQueue.add('expire', { bookingCode }, { delay: lockTimeMs }); // Dynamic delay

            // 6. Emit Socket Event
            this.bookingGateway.emitSeatsLocked(tripId, seatIds);

            return {
                bookingId: booking.id,
                bookingCode: booking.code,
            };

        } catch (error) {
            // Rollback locks if anything failed
            if (acquiredLocks.length > 0) {
                await Promise.all(acquiredLocks.map(key => this.redis.del(key)));
            }
            throw error;
        }
    }

    async updateBookingStatus(code: string, status: string) {
        // Triển khai logic cập nhật trạng thái
    }

    async cancelBooking(code: string, userId?: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { code },
        });

        if (!booking) {
            throw new BadRequestException('Không tìm thấy đơn đặt chỗ');
        }

        // Validate Ownership if userId is provided
        if (userId && booking.userId && booking.userId !== userId) {
            throw new BadRequestException('Bạn không có quyền hủy đơn hàng này');
        }

        if (booking.status !== 'PENDING') {
            throw new BadRequestException('Chỉ có thể hủy đơn hàng đang chờ thanh toán');
        }

        // Proceed to cancel
        await this.prisma.booking.update({
            where: { code },
            data: { status: 'CANCELLED' }
        });

        this.bookingGateway.emitBookingStatusUpdate(code, 'CANCELLED');

        // Release locks
        if (booking.metadata) {
            const metadata = booking.metadata as unknown as BookingMetadata;
            if (metadata.tripId && metadata.seatIds) { // For initBooking style
                this.bookingGateway.emitSeatsReleased(metadata.tripId, metadata.seatIds);
                // Also delete from Redis
                const locks = metadata.seatIds.map((id: string) => `lock:seat:${metadata.tripId}:${id}`);
                if (locks.length > 0) {
                    await Promise.all(locks.map((key: string) => this.redis.del(key)));
                }
            } else if (metadata.tripId && metadata.passengers) { // For createBooking style (legacy/mixed)
                const seatIds = metadata.passengers.map((p) => p.seatId);
                this.bookingGateway.emitSeatsReleased(metadata.tripId, seatIds);
                const locks = seatIds.map((id: string) => `lock:seat:${metadata.tripId}:${id}`);
                if (locks.length > 0) {
                    await Promise.all(locks.map((key: string) => this.redis.del(key)));
                }
            }
        }

        return { message: 'Hủy đơn hàng thành công' };
    }

    async handleBookingExpiration(bookingCode: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { code: bookingCode },
        });

        if (booking && booking.status === 'PENDING') {
            this.logger.warn(`Booking ${bookingCode} expired. Cancelling...`);
            await this.prisma.booking.update({
                where: { code: bookingCode },
                data: {
                    status: 'CANCELLED', // Or EXPIRED depending on requirement
                }
            });

            this.bookingGateway.emitBookingStatusUpdate(bookingCode, 'CANCELLED');

            // Locks will expire automatically by Redis TTL, but we emit event for clearer UI update
            if (booking.metadata) {
                const metadata = booking.metadata as unknown as BookingMetadata;
                if (metadata.tripId) {
                    let seatIds: string[] = [];
                    if (metadata.seatIds) {
                        seatIds = metadata.seatIds;
                    } else if (metadata.passengers) {
                        seatIds = metadata.passengers.map((p) => p.seatId);
                    }

                    if (seatIds.length > 0) {
                        this.bookingGateway.emitSeatsReleased(metadata.tripId, seatIds);
                    }
                }
            }
        }
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
        await this.validatePassengers(passengers, passengerGroups);

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
                tickets: {
                    include: {
                        seat: {
                            include: {
                                coach: true
                            }
                        }
                    }
                }
            },
        });

        if (!booking) {
            throw new BadRequestException('Không tìm thấy đơn hàng');
        }

        const lockTimeMin = this.configService.get<number>('BOOKING_LOCK_TIME_MINUTES') || 10;
        const expiresAt = dayjs(booking.createdAt).add(lockTimeMin, 'minute').toDate();

        // Enrich for PENDING, CANCELLED, or PAYMENT_FAILED state if tickets are empty 
        if ((booking.status === 'PENDING' || booking.status === 'CANCELLED' || booking.status === 'PAYMENT_FAILED') && booking.tickets.length === 0 && booking.metadata) {
            const metadata = booking.metadata as any;

            // Case 1: Has Passengers info in metadata (User filled details but didn't pay)
            if (metadata.passengers && metadata.passengers.length > 0) {
                // Fetch seat info for these passengers to display seat name
                const seatIds = metadata.passengers.map((p: any) => p.seatId);
                const seats = await this.prisma.seat.findMany({
                    where: { id: { in: seatIds } },
                    include: { coach: true }
                });

                const enrichedSeats = seats.map(s => ({
                    id: s.id,
                    name: `${s.coach.name}-${s.name}`,
                    price: metadata.passengers.find((p: any) => p.seatId === s.id)?.price || 0
                }));

                const simulatedTickets = metadata.passengers.map((p: any, index: number) => {
                    const seat = seats.find(s => s.id === p.seatId);
                    return {
                        id: `temp-${index}`,
                        passengerName: p.passengerName,
                        passengerId: p.passengerId,
                        price: p.price,
                        seat: seat ? { name: `${seat.coach.name}-${seat.name}` } : { name: 'Giữ chỗ' }
                    };
                });

                return {
                    ...booking,
                    expiresAt,
                    tickets: simulatedTickets,
                    metadata: {
                        ...metadata,
                        seats: enrichedSeats
                    }
                };
            }

            // Case 2: Only Seat selection
            const seatIds = metadata.seatIds as string[] || [];
            if (seatIds.length > 0) {
                const seats = await this.prisma.seat.findMany({
                    where: { id: { in: seatIds } },
                    include: { coach: { include: { template: true } } }
                });

                // Need station info for pricing
                const fromStationId = metadata.fromStationId;
                const toStationId = metadata.toStationId;
                const trip = booking.trip;

                // Fetch station info if needed
                const fromStation = (trip.route as any).stations.find((s: any) => s.stationId === fromStationId) ||
                    await this.prisma.routeStation.findFirst({ where: { routeId: trip.routeId, stationId: fromStationId } });
                const toStation = await this.prisma.routeStation.findFirst({ where: { routeId: trip.routeId, stationId: toStationId } });

                const enrichedSeats: { id: string; name: string; price: number }[] = [];
                const simulatedTickets: any[] = [];

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
                            discountRate: 0,
                        });

                        const seatName = `${seat.coach.name}-${seat.name}`;
                        enrichedSeats.push({
                            id: seat.id,
                            name: seatName,
                            price: price,
                        });

                        simulatedTickets.push({
                            id: `temp-seat-${seat.id}`,
                            passengerName: 'Chưa nhập tên',
                            passengerId: '',
                            price: price,
                            seat: { name: seatName }
                        });
                    }
                }

                return {
                    ...booking,
                    expiresAt,
                    tickets: simulatedTickets,
                    metadata: {
                        ...metadata,
                        seats: enrichedSeats
                    }
                };
            }
        }

        return { ...booking, expiresAt };
    }
    async getLockedSeats(tripId: string) {
        // Scan for keys: lock:seat:{tripId}:*
        const pattern = `lock:seat:${tripId}:*`;
        const keys = await this.redis.keys(pattern);

        // Extract seatIds from keys
        const seatIds = keys.map(key => key.split(':').pop());
        return { seatIds };
    }

    private async validatePassengers(passengers: any[], passengerGroups: any[]) {
        for (const passenger of passengers) {
            const group = passengerGroups.find(g => g.id === passenger.passengerGroupId);
            if (!group) continue; // Or throw error? Logic in original code skipped if not found in loop, but explicit check existed before.

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

                // Logging handled by caller or removed to reduce noise
            }
        }
    }


    private async validateBookingPolicy(userId: string, tripId: string, numberOfSeats: number) {
        // 1. CHẶN SỐ LƯỢNG GHẾ (Logic đơn giản check input)
        if (numberOfSeats > 6) {
            throw new BadRequestException("Mỗi đơn hàng chỉ được đặt tối đa 6 vé.");
        }

        // Lấy danh sách các đơn đang PENDING của user này (chưa hết hạn - within 10 mins)
        // Since we have a job that runs every 10 mins to cancel, PENDING usually means active.
        // But to be precise as user requested "chưa hết hạn", let's be safe.
        const lockTimeMin = this.configService.get<number>('BOOKING_LOCK_TIME_MINUTES') || 10;
        const cutoffTime = dayjs().subtract(lockTimeMin, 'minute').toDate();

        const activePendingBookings = await this.prisma.booking.findMany({
            where: {
                userId: userId,
                status: 'PENDING',
                createdAt: { gt: cutoffTime } // Chỉ tính đơn còn hiệu lực trong khoảng lock, tránh đơn bị kẹt job chưa chạy
            },
            select: { id: true, tripId: true }
        });

        // 2. CHẶN GLOBAL PENDING (Tối đa 3)
        if (activePendingBookings.length >= 3) {
            throw new BadRequestException(
                "Bạn đang giữ quá nhiều đơn chưa thanh toán (Tối đa 3 đơn). Vui lòng xử lý đơn cũ trước."
            );
        }

        // 3. CHẶN PENDING TRÊN CÙNG CHUYẾN (Tối đa 1)
        // Check xem trong list pending, có đơn nào thuộc tripId hiện tại không?
        const isAlreadyBookingThisTrip = activePendingBookings.some(
            b => b.tripId === tripId
        );

        if (isAlreadyBookingThisTrip) {
            throw new BadRequestException(
                "Bạn đã có một đơn hàng đang chờ thanh toán cho chuyến này. Vui lòng thanh toán đơn cũ hoặc hủy bỏ để đặt mới."
            );
        }
    }
}
