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

        // 1. Kiểm tra thông tin Chuyến tàu & Tuyến đường
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
}
