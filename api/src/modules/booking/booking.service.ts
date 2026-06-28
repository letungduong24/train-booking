import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
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
import {
  validateCCCD,
  validateCCCDAgeForGroup,
} from '../../common/utils/cccd.util';

import { BookingGateway } from './booking.gateway';
import { TripService } from '../trip/trip.service';
import { MailService } from '../mail/mail.service';
import { TicketService } from '../ticket/ticket.service';

type SeatLockSegment = {
  seatId: string;
  fromStationIndex: number;
  toStationIndex: number;
};

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
    private readonly tripService: TripService,
    private readonly mailService: MailService,
    private readonly ticketService: TicketService,
  ) {}

  async triggerStatsUpdate(tripId: string) {
    try {
      const stats = await this.tripService.getTripStats(tripId);
      this.bookingGateway.emitTripStatsUpdate(tripId, stats);
    } catch (error) {
      this.logger.error(
        `Failed to trigger stats update for trip ${tripId}`,
        error,
      );
    }
  }

  async createBooking(
    userId: string | null,
    dto: CreateBookingDto,
    ipAddr: string,
  ) {
    const { tripId, passengers, fromStationId, toStationId } = dto;

    // 1. Kiểm tra thông tin Chuyến tàu & Tuyến đường
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: {
          include: {
            stations: {
              include: { station: true },
            },
          },
        },
        train: {
          include: {
            coaches: {
              include: {
                template: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new BadRequestException('Không tìm thấy chuyến tàu');
    }

    // Check trip status - only allow booking for SCHEDULED trips
    if (trip.status !== 'SCHEDULED') {
      throw new BadRequestException(
        trip.status === 'IN_PROGRESS'
          ? 'Chuyến tàu đã khởi hành, không thể đặt vé'
          : trip.status === 'COMPLETED'
            ? 'Chuyến tàu đã hoàn thành, không thể đặt vé'
            : 'Chuyến tàu không khả dụng',
      );
    }

    const { fromStation, toStation } = await this.resolveRouteStationPair(
      trip.routeId,
      trip.route.stations,
      fromStationId,
      toStationId,
    );

    if (!fromStation || !toStation) {
      throw new BadRequestException('Ga đến hoặc ga đi không hợp lệ');
    }

    // 2. Kiểm tra Hành khách & Tính giá vé (áp dụng giảm giá)
    const seatIds = passengers.map((p) => p.seatId);
    const seats = await this.prisma.seat.findMany({
      where: {
        id: { in: seatIds },
      },
      include: {
        coach: {
          include: {
            template: true,
          },
        },
      },
    });

    if (seats.length !== seatIds.length) {
      throw new BadRequestException('Một số ghế ngồi không tìm thấy');
    }

    // Lấy danh sách đối tượng hành khách
    const passengerGroupIds = passengers.map((p) => p.passengerGroupId);
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
      const seat = seats.find((s) => s.id === passenger.seatId);
      if (!seat) {
        throw new BadRequestException(`Ghế ${passenger.seatId} không tìm thấy`);
      }

      const group = passengerGroups.find(
        (g) => g.id === passenger.passengerGroupId,
      );
      if (!group) {
        throw new BadRequestException(
          `Loại hành khách ${passenger.passengerGroupId} không tìm thấy`,
        );
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
    const bookingCode = `RAILFLOW-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000)}`;

    const booking = await this.prisma.booking.create({
      data: {
        code: bookingCode,
        userId: userId,
        tripId: tripId,
        totalPrice: totalPrice,
        status: 'PENDING',
        metadata: {
          tripId,
          fromStationId: fromStation.stationId,
          toStationId: toStation.stationId,
          requestedFromStationId: fromStationId,
          requestedToStationId: toStationId,
          passengers: ticketInputs.map((t) => ({
            seatId: t.seatId,
            price: t.price,
            passengerName: t.passengerName,
            passengerId: t.passengerId,
            passengerGroupId: t.passengerGroupId,
            fromStationIndex: t.fromStationIndex,
            toStationIndex: t.toStationIndex,
          })),
        },
      },
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
    const seatIds = tickets.map((t) => t.seatId);

    // Check if trip is still SCHEDULED
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { status: true },
    });

    if (trip?.status !== 'SCHEDULED') {
      this.logger.error(
        `Trip ${tripId} is no longer SCHEDULED. Current status: ${trip?.status}`,
      );

      // Hoàn tiền nếu đã thanh toán
      if (booking.userId) {
        try {
          await this.walletService.refundToWallet(
            booking.userId,
            booking.totalPrice,
            bookingCode,
            'Hoàn tiền tự động - Chuyến tàu đã khởi hành',
          );
          this.logger.log(
            `Refunded ${booking.totalPrice} to wallet for user ${booking.userId}`,
          );
        } catch (refundError) {
          this.logger.error(
            `Failed to refund to wallet for booking ${bookingCode}`,
            refundError,
          );
        }
      }

      // Cập nhật trạng thái
      await this.prisma.booking.update({
        where: { code: bookingCode },
        data: { status: 'CANCELLED' },
      });

      throw new BadRequestException(
        'Chuyến tàu đã khởi hành. Tiền đã được hoàn về ví của bạn.',
      );
    }

    const existingTickets = await this.prisma.ticket.findMany({
      where: {
        tripId: tripId,
        booking: {
          status: 'PAID',
        },
        OR: tickets.map((ticket) => ({
          seatId: ticket.seatId,
          fromStationIndex: { lt: ticket.toStationIndex },
          toStationIndex: { gt: ticket.fromStationIndex },
        })),
      },
    });

    if (existingTickets.length > 0) {
      this.logger.error(
        `Race condition detected for Booking ${bookingCode}. Seats already taken.`,
      );

      // Hoàn tiền nếu thanh toán bằng ví
      if (booking.userId) {
        try {
          await this.walletService.refundToWallet(
            booking.userId,
            booking.totalPrice,
            bookingCode,
            'Hoàn tiền tự động do hết ghế (Lỗi đồng bộ)',
          );
          this.logger.log(
            `Refunded ${booking.totalPrice} to wallet for user ${booking.userId}`,
          );
        } catch (refundError) {
          this.logger.error(
            `Failed to refund to wallet for booking ${bookingCode}`,
            refundError,
          );
        }
      }

      // Cập nhật trạng thái để Admin biết
      await this.prisma.booking.update({
        where: { code: bookingCode },
        data: {
          status: 'PAYMENT_FAILED',
        },
      });

      throw new BadRequestException(
        'Ghế đã được đặt bởi người khác. Tiền đã được hoàn về ví của bạn.',
      );
    }

    const lockedByOthers = await this.findOverlappingSeatLocks(
      tripId,
      tickets,
      bookingCode,
    );

    if (lockedByOthers.length > 0) {
      this.logger.error(
        `Booking ${bookingCode} rejected: Seats are locked by another active booking`,
      );

      // Hoàn tiền nếu thanh toán bằng ví
      if (booking.userId) {
        try {
          await this.walletService.refundToWallet(
            booking.userId,
            booking.totalPrice,
            bookingCode,
            'Hoàn tiền do ghế đang được giữ bởi người khác',
          );
          this.logger.log(
            `Refunded ${booking.totalPrice} to wallet for user ${booking.userId}`,
          );
        } catch (refundError) {
          this.logger.error(
            `Failed to refund to wallet for booking ${bookingCode}`,
            refundError,
          );
        }
      }

      // Cập nhật trạng thái
      await this.prisma.booking.update({
        where: { code: bookingCode },
        data: {
          status: 'PAYMENT_FAILED',
        },
      });

      throw new BadRequestException(
        'Ghế đang được giữ bởi người khác. Tiền đã được hoàn về ví của bạn.',
      );
    }

    // Tạo vé và đánh dấu các đoạn ghế bị chiếm trong cùng một transaction.
    let updatedBooking;
    try {
      updatedBooking = await this.prisma.$transaction(
        async (tx) => {
          const statusLock = await tx.booking.updateMany({
            where: { code: bookingCode, status: 'PENDING' },
            data: {
              status: 'PAID',
              metadata: Prisma.JsonNull,
            },
          });

          if (statusLock.count === 0) {
            const paidBooking = await this.findPaidBookingForReceipt(
              bookingCode,
              tx,
            );
            if (paidBooking) return paidBooking;
            throw new BadRequestException(
              'Đơn đặt chỗ không còn ở trạng thái chờ thanh toán',
            );
          }

          const createdTickets: {
            id: string;
            tripId: string;
            seatId: string;
            fromStationIndex: number;
            toStationIndex: number;
          }[] = [];
          for (const ticket of tickets) {
            createdTickets.push(
              await tx.ticket.create({
                data: {
                  bookingId: booking.id,
                  ...ticket,
                },
              }),
            );
          }

          const occupiedSegments = createdTickets.flatMap((ticket) =>
            this.buildTicketSeatSegments(ticket),
          );

          if (occupiedSegments.length > 0) {
            await tx.ticketSeatSegment.createMany({
              data: occupiedSegments,
            });
          }

          return this.findPaidBookingForReceipt(bookingCode, tx);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error: any) {
      if (error?.code !== 'P2002') {
        throw error;
      }

      const paidBooking = await this.prisma.booking.findUnique({
        where: { code: bookingCode },
        include: {
          user: true,
          trip: {
            include: {
              train: true,
              route: true,
            },
          },
          tickets: {
            include: {
              seat: {
                include: {
                  coach: true,
                },
              },
            },
          },
        },
      });

      if (paidBooking?.status === 'PAID') {
        this.logger.warn(`Booking ${bookingCode} was confirmed by another callback`);
        return paidBooking;
      }

      if (booking.userId) {
        await this.walletService.refundToWallet(
          booking.userId,
          booking.totalPrice,
          bookingCode,
          'Hoàn tiền tự động do ghế đã được đặt bởi người khác',
        );
      }

      await this.prisma.booking.update({
        where: { code: bookingCode },
        data: { status: 'PAYMENT_FAILED' },
      });

      throw new BadRequestException(
        'Ghế đã được đặt bởi người khác. Tiền đã được hoàn về ví của bạn.',
      );
    }

    if (!updatedBooking) {
      throw new BadRequestException('Không thể xác nhận đơn đặt chỗ');
    }

    this.bookingGateway.emitBookingStatusUpdate(bookingCode, 'PAID');

    // Gửi email biên lai kèm vé PDF
    if (updatedBooking.user?.email) {
      try {
        const pdfBuffer = await this.ticketService.generateBookingTicketsPDF(
          updatedBooking,
        );
        await this.mailService.sendBookingReceipt(
          updatedBooking.user.email,
          updatedBooking,
          pdfBuffer,
        );
      } catch (error) {
        this.logger.error(
          `Lỗi khi gửi email biên lai/vé cho ${bookingCode}: ${error.message}`,
        );
        // Nếu lỗi tạo PDF, vẫn cố gửi email biên lai không đính kèm (dự phòng)
        await this.mailService.sendBookingReceipt(
          updatedBooking.user.email,
          updatedBooking,
        ).catch(() => {});
      }
    }

    // Xóa lock Redis và thông báo release
    if (metadata.tripId && metadata.passengers) {
      const tripId = metadata.tripId;
      const seatIds = metadata.passengers.map((p: any) => p.seatId);
      const lockSegments = this.getSeatLockSegmentsFromMetadata(metadata);

      await this.releaseSeatLocks(tripId, lockSegments, seatIds);

      // Emit sự kiện để các client khác bỏ màu vàng (chuyển sang đỏ nếu logic FE/BE đã sync status BOOKED, hoặc xanh tạm thời)
      // Tốt nhất là các client nên trigger fetch lại seats khi nhận event này hoặc một event `seats.booked` riêng.
      // Nhưng hiện tại để fix lỗi "bị ghi đè locked" thì ta release lock là được.
      this.emitSeatLocksReleased(tripId, lockSegments, seatIds);
      this.emitSeatLocksBooked(tripId, lockSegments, seatIds);
    }

    this.logger.log(
      `Đã xác nhận đơn hàng ${bookingCode} với ${tickets.length} vé`,
    );

    // Update stats
    this.triggerStatsUpdate(tickets[0].tripId);

    return updatedBooking;
  }

  async getMyBookings(userId: string, query: FilterBookingDto) {
    const {
      page = 1,
      limit = 10,
      skip,
      take,
      search,
      status,
      sort,
      order,
    } = query;

    const where: Prisma.BookingWhereInput = {
      userId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          {
            trip: {
              train: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
          {
            trip: {
              route: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ],
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

    const lockTimeMin =
      this.configService.get<number>('BOOKING_LOCK_TIME_MINUTES') || 10;

    const enrichedData = data.map((booking) => ({
      ...booking,
      expiresAt: dayjs(booking.createdAt).add(lockTimeMin, 'minute').toDate(),
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

  async getMyActiveTrips(userId: string) {
    return this.prisma.booking.findMany({
      where: {
        userId,
        status: 'PAID',
        trip: {
          status: 'IN_PROGRESS',
        },
      },
      include: {
        trip: {
          include: {
            route: true,
            train: true,
          },
        },
      },
      orderBy: {
        trip: {
          departureTime: 'asc',
        },
      },
    });
  }

  async initBooking(
    userId: string | null,
    dto: InitBookingDto,
    ipAddr: string,
  ) {
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
              include: { station: true },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new BadRequestException('Không tìm thấy chuyến tàu');
    }

    const { fromStation, toStation } = await this.resolveRouteStationPair(
      trip.routeId,
      trip.route.stations,
      fromStationId,
      toStationId,
    );

    if (!fromStation || !toStation) {
      throw new BadRequestException('Ga đến hoặc ga đi không hợp lệ');
    }

    // 2. Validate Seats
    const seats = await this.prisma.seat.findMany({
      where: {
        id: { in: seatIds },
      },
    });

    if (seats.length !== seatIds.length) {
      throw new BadRequestException('Một số ghế không hợp lệ');
    }

    const occupiedTickets = await this.prisma.ticket.findMany({
      where: {
        tripId,
        seatId: { in: seatIds },
        booking: {
          status: 'PAID',
        },
        fromStationIndex: { lt: toStation.index },
        toStationIndex: { gt: fromStation.index },
      },
      select: {
        seat: {
          select: {
            name: true,
            coach: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (occupiedTickets.length > 0) {
      const occupiedNames = occupiedTickets
        .map((ticket) => `${ticket.seat.name} (${ticket.seat.coach.name})`)
        .join(', ');
      throw new BadRequestException(
        `Ghế ${occupiedNames} đã được đặt trên chặng này. Vui lòng chọn ghế khác.`,
      );
    }

    // 3. Redis Lock Check (Optimistic Locking)
    const bookingCode = `RAILFLOW-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000)}`;
    const acquiredLocks: string[] = [];
    const lockSegments = seatIds.map((seatId) => ({
      seatId,
      fromStationIndex: fromStation.index,
      toStationIndex: toStation.index,
    }));

    const lockTimeMin =
      this.configService.get<number>('BOOKING_LOCK_TIME_MINUTES') || 10;
    const lockTimeSec = lockTimeMin * 60;
    const lockTimeMs = lockTimeMin * 60 * 1000;

    try {
      for (const segment of lockSegments) {
        const key = this.buildSeatLockKey(tripId, segment);
        const result = await this.acquireSeatSegmentLock(
          tripId,
          segment,
          bookingCode,
          lockTimeSec,
        );

        if (!result) {
          // Lock failed, meaning seat is taken
          // Instead of throwing immediately, we want to know ALL failed seats to report meaningful names
          // But for simplicity/performance in optimistic lock, failing on first one is fine, just need its name.
          const lockedSeat = await this.prisma.seat.findUnique({
            where: { id: segment.seatId },
            include: { coach: true },
          });
          const seatName = lockedSeat
            ? `${lockedSeat.name} (Toa ${lockedSeat.coach.name})`
            : segment.seatId;
          throw new BadRequestException(
            `Ghế ${seatName} đang được giữ bởi người khác trên chặng này. Vui lòng thử lại sau.`,
          );
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
            fromStationId: fromStation.stationId,
            toStationId: toStation.stationId,
            requestedFromStationId: fromStationId,
            requestedToStationId: toStationId,
            fromStationIndex: fromStation.index,
            toStationIndex: toStation.index,
            seatIds,
          },
        },
      });

      // 5. Add to Expiration Queue
      await this.bookingQueue.add(
        'expire',
        { bookingCode },
        { delay: lockTimeMs },
      ); // Dynamic delay

      // 6. Emit Socket Event
      this.emitSeatLocksLocked(tripId, lockSegments, seatIds);
      this.triggerStatsUpdate(tripId);

      return {
        bookingId: booking.id,
        bookingCode: booking.code,
      };
    } catch (error) {
      // Rollback locks if anything failed
      if (acquiredLocks.length > 0) {
        await Promise.all(acquiredLocks.map((key) => this.redis.del(key)));
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
      throw new BadRequestException(
        'Chỉ có thể hủy đơn hàng đang chờ thanh toán',
      );
    }

    // Proceed to cancel
    await this.prisma.booking.update({
      where: { code },
      data: { status: 'CANCELLED' },
    });

    this.bookingGateway.emitBookingStatusUpdate(code, 'CANCELLED');

    if (booking.metadata) {
      const metadata = booking.metadata as unknown as BookingMetadata;

      // Trigger stats update if tripId is present
      if (metadata.tripId) {
        this.triggerStatsUpdate(metadata.tripId);
      }

      const lockSegments = this.getSeatLockSegmentsFromMetadata(metadata);

      if (metadata.tripId && metadata.seatIds) {
        // For initBooking style
        await this.releaseSeatLocks(
          metadata.tripId,
          lockSegments,
          metadata.seatIds,
        );
        this.emitSeatLocksReleased(metadata.tripId, lockSegments, metadata.seatIds);
      } else if (metadata.tripId && metadata.passengers) {
        // For createBooking style (legacy/mixed)
        const seatIds = metadata.passengers.map((p) => p.seatId);
        await this.releaseSeatLocks(metadata.tripId, lockSegments, seatIds);
        this.emitSeatLocksReleased(metadata.tripId, lockSegments, seatIds);
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
        },
      });

      this.bookingGateway.emitBookingStatusUpdate(bookingCode, 'CANCELLED');

      // Locks will expire automatically by Redis TTL, but we emit event for clearer UI update
      if (booking.metadata) {
        const metadata = booking.metadata as unknown as BookingMetadata;
        if (metadata.tripId) {
          this.triggerStatsUpdate(metadata.tripId);

          let seatIds: string[] = [];
          if (metadata.seatIds) {
            seatIds = metadata.seatIds;
          } else if (metadata.passengers) {
            seatIds = metadata.passengers.map((p) => p.seatId);
          }

          if (seatIds.length > 0) {
            const lockSegments = this.getSeatLockSegmentsFromMetadata(metadata);
            await this.releaseSeatLocks(metadata.tripId, lockSegments, seatIds);
            this.emitSeatLocksReleased(metadata.tripId, lockSegments, seatIds);
          }
        }
      }
    }
  }

  async updateBookingPassengers(
    code: string,
    dto: UpdateBookingPassengersDto,
    ipAddr: string,
    userId?: string,
  ) {
    const { passengers } = dto;

    const booking = await this.prisma.booking.findUnique({
      where: { code },
      include: {
        trip: {
          include: {
            route: {
              include: {
                stations: {
                  include: { station: true },
                },
              },
            },
            train: {
              include: {
                coaches: {
                  include: { template: true },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new BadRequestException('Bản ghi đặt chỗ không tồn tại');
    }

    if (userId && booking.userId && booking.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền cập nhật đơn hàng này');
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Đơn hàng không ở trạng thái chờ xử lý');
    }

    const metadata = booking.metadata as any;
    const fromStationId = metadata.fromStationId;
    const toStationId = metadata.toStationId;
    const trip = booking.trip;

    const { fromStation, toStation } = await this.resolveRouteStationPair(
      trip.routeId,
      (trip.route as any).stations,
      fromStationId,
      toStationId,
    );

    if (!fromStation || !toStation)
      throw new BadRequestException('Ga không hợp lệ');

    // Validate Passengers & Calculate Prices
    const seatIds = passengers.map((p) => p.seatId);
    const seats = await this.prisma.seat.findMany({
      where: { id: { in: seatIds } },
      include: { coach: { include: { template: true } } },
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
      const seat = seats.find((s) => s.id === passenger.seatId);
      const group = passengerGroups.find(
        (g) => g.id === passenger.passengerGroupId,
      );
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
        ...passenger,
      });
    }

    // Update Booking
    await this.prisma.booking.update({
      where: { code },
      data: {
        totalPrice,
        metadata: {
          ...metadata,
          fromStationId: fromStation.stationId,
          toStationId: toStation.stationId,
          requestedFromStationId: metadata.requestedFromStationId ?? fromStationId,
          requestedToStationId: metadata.requestedToStationId ?? toStationId,
          fromStationIndex: fromStation.index,
          toStationIndex: toStation.index,
          passengers: ticketInputs.map((t) => ({
            seatId: t.seatId,
            price: t.price,
            passengerName: t.passengerName,
            passengerId: t.passengerId,
            passengerGroupId: t.passengerGroupId,
            fromStationIndex: fromStation.index,
            toStationIndex: toStation.index,
          })),
        },
      },
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
      totalPrice,
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
                  include: { station: true },
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
                coach: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new BadRequestException('Không tìm thấy đơn hàng');
    }

    const lockTimeMin =
      this.configService.get<number>('BOOKING_LOCK_TIME_MINUTES') || 10;
    const expiresAt = dayjs(booking.createdAt)
      .add(lockTimeMin, 'minute')
      .toDate();

    // Enrich for PENDING, CANCELLED, or PAYMENT_FAILED state if tickets are empty
    if (
      (booking.status === 'PENDING' ||
        booking.status === 'CANCELLED' ||
        booking.status === 'PAYMENT_FAILED') &&
      booking.tickets.length === 0 &&
      booking.metadata
    ) {
      const metadata = booking.metadata as any;
      const resolvedStations =
        metadata.fromStationId && metadata.toStationId
          ? await this.resolveRouteStationPair(
              booking.trip.routeId,
              (booking.trip.route as any).stations,
              metadata.fromStationId,
              metadata.toStationId,
            ).catch(() => null)
          : null;
      const normalizedMetadata = resolvedStations
        ? this.withResolvedStations(metadata, resolvedStations.fromStation, resolvedStations.toStation)
        : metadata;

      // Case 1: Has Passengers info in metadata (User filled details but didn't pay)
      if (normalizedMetadata.passengers && normalizedMetadata.passengers.length > 0) {
        // Fetch seat info for these passengers to display seat name
        const seatIds = normalizedMetadata.passengers.map((p: any) => p.seatId);
        const seats = await this.prisma.seat.findMany({
          where: { id: { in: seatIds } },
          include: { coach: true },
        });

        const enrichedSeats = seats.map((s) => ({
          id: s.id,
          name: `${s.coach.name}-${s.name}`,
          price:
            normalizedMetadata.passengers.find((p: any) => p.seatId === s.id)?.price || 0,
        }));

        const simulatedTickets = normalizedMetadata.passengers.map(
          (p: any, index: number) => {
            const seat = seats.find((s) => s.id === p.seatId);
            return {
              id: `temp-${index}`,
              passengerName: p.passengerName,
              passengerId: p.passengerId,
              price: p.price,
              seat: seat
                ? { name: `${seat.coach.name}-${seat.name}` }
                : { name: 'Giữ chỗ' },
            };
          },
        );

        return {
          ...booking,
          expiresAt,
          tickets: simulatedTickets,
          metadata: {
            ...normalizedMetadata,
            seats: enrichedSeats,
          },
        };
      }

      // Case 2: Only Seat selection
      const seatIds = (normalizedMetadata.seatIds as string[]) || [];
      if (seatIds.length > 0) {
        const seats = await this.prisma.seat.findMany({
          where: { id: { in: seatIds } },
          include: { coach: { include: { template: true } } },
        });

        // Need station info for pricing
        const trip = booking.trip;
        const fromStation = resolvedStations?.fromStation;
        const toStation = resolvedStations?.toStation;

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
              seat: { name: seatName },
            });
          }
        }

        return {
          ...booking,
          expiresAt,
          tickets: simulatedTickets,
          metadata: {
            ...normalizedMetadata,
            seats: enrichedSeats,
          },
        };
      }
    }

    return { ...booking, expiresAt };
  }
  async getLockedSeats(
    tripId: string,
    fromStationId?: string,
    toStationId?: string,
  ) {
    let targetSegment: Omit<SeatLockSegment, 'seatId'> | null = null;

    if (fromStationId && toStationId) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          route: {
            include: {
              stations: {
                include: { station: true },
              },
            },
          },
        },
      });

      if (trip) {
        const { fromStation, toStation } = await this.resolveRouteStationPair(
          trip.routeId,
          trip.route.stations,
          fromStationId,
          toStationId,
        );
        if (fromStation && toStation) {
          targetSegment = {
            fromStationIndex: fromStation.index,
            toStationIndex: toStation.index,
          };
        }
      }
    }

    const keys = await this.redis.keys(`lock:seat:${tripId}:*`);
    const lockedSeatIds = new Set<string>();

    for (const key of keys) {
      const parsed = this.parseSeatLockKey(key, tripId);
      if (!parsed) continue;

      if (!targetSegment || parsed.isLegacy) {
        lockedSeatIds.add(parsed.seatId);
        continue;
      }

      if (
        this.segmentsOverlap(
          parsed.fromStationIndex,
          parsed.toStationIndex,
          targetSegment.fromStationIndex,
          targetSegment.toStationIndex,
        )
      ) {
        lockedSeatIds.add(parsed.seatId);
      }
    }

    return { seatIds: [...lockedSeatIds] };
  }

  private buildSeatLockPrefix(tripId: string, seatId: string) {
    return `lock:seat:${tripId}:${seatId}`;
  }

  private buildSeatLockKey(tripId: string, segment: SeatLockSegment) {
    return `${this.buildSeatLockPrefix(tripId, segment.seatId)}:${segment.fromStationIndex}:${segment.toStationIndex}`;
  }

  private parseSeatLockKey(key: string, tripId?: string) {
    const parts = key.split(':');
    if (parts.length < 4 || parts[0] !== 'lock' || parts[1] !== 'seat') {
      return null;
    }

    const [, , keyTripId, seatId, from, to] = parts;
    if (tripId && keyTripId !== tripId) return null;

    if (parts.length === 4) {
      return {
        seatId,
        fromStationIndex: Number.NEGATIVE_INFINITY,
        toStationIndex: Number.POSITIVE_INFINITY,
        isLegacy: true,
      };
    }

    const fromStationIndex = Number(from);
    const toStationIndex = Number(to);
    if (!Number.isFinite(fromStationIndex) || !Number.isFinite(toStationIndex)) {
      return null;
    }

    return {
      seatId,
      fromStationIndex,
      toStationIndex,
      isLegacy: false,
    };
  }

  private segmentsOverlap(
    fromA: number,
    toA: number,
    fromB: number,
    toB: number,
  ) {
    return fromA < toB && toA > fromB;
  }

  private async acquireSeatSegmentLock(
    tripId: string,
    segment: SeatLockSegment,
    bookingCode: string,
    ttlSeconds: number,
  ) {
    const prefix = this.buildSeatLockPrefix(tripId, segment.seatId);
    const key = this.buildSeatLockKey(tripId, segment);
    const script = `
      local legacy = redis.call("GET", KEYS[1])
      if legacy and legacy ~= ARGV[1] then
        return "LOCKED"
      end

      local keys = redis.call("KEYS", KEYS[1] .. ":*")
      for _, existingKey in ipairs(keys) do
        local value = redis.call("GET", existingKey)
        if value and value ~= ARGV[1] then
          local parts = {}
          for part in string.gmatch(existingKey, "[^:]+") do
            table.insert(parts, part)
          end
          local fromIndex = tonumber(parts[#parts - 1])
          local toIndex = tonumber(parts[#parts])
          if fromIndex and toIndex and fromIndex < tonumber(ARGV[3]) and toIndex > tonumber(ARGV[2]) then
            return "LOCKED"
          end
        end
      end

      return redis.call("SET", KEYS[2], ARGV[1], "EX", ARGV[4], "NX")
    `;

    const result = await this.redis.eval(
      script,
      2,
      prefix,
      key,
      bookingCode,
      String(segment.fromStationIndex),
      String(segment.toStationIndex),
      String(ttlSeconds),
    );

    return result === 'OK';
  }

  private async findOverlappingSeatLocks(
    tripId: string,
    segments: SeatLockSegment[],
    bookingCode?: string,
  ) {
    const keys = await this.redis.keys(`lock:seat:${tripId}:*`);
    const lockedSeatIds = new Set<string>();
    const values = await Promise.all(keys.map((key) => this.redis.get(key)));

    keys.forEach((key, index) => {
      const value = values[index];
      if (!value || value === bookingCode) return;

      const parsed = this.parseSeatLockKey(key, tripId);
      if (!parsed) return;

      const target = segments.find((segment) => segment.seatId === parsed.seatId);
      if (!target) return;

      if (
        parsed.isLegacy ||
        this.segmentsOverlap(
          parsed.fromStationIndex,
          parsed.toStationIndex,
          target.fromStationIndex,
          target.toStationIndex,
        )
      ) {
        lockedSeatIds.add(parsed.seatId);
      }
    });

    return [...lockedSeatIds];
  }

  private getSeatLockSegmentsFromMetadata(metadata: any): SeatLockSegment[] {
    if (metadata?.passengers?.length) {
      return metadata.passengers
        .filter(
          (passenger: any) =>
            passenger.seatId &&
            Number.isInteger(passenger.fromStationIndex) &&
            Number.isInteger(passenger.toStationIndex),
        )
        .map((passenger: any) => ({
          seatId: passenger.seatId,
          fromStationIndex: passenger.fromStationIndex,
          toStationIndex: passenger.toStationIndex,
        }));
    }

    if (
      metadata?.seatIds?.length &&
      Number.isInteger(metadata.fromStationIndex) &&
      Number.isInteger(metadata.toStationIndex)
    ) {
      return metadata.seatIds.map((seatId: string) => ({
        seatId,
        fromStationIndex: metadata.fromStationIndex,
        toStationIndex: metadata.toStationIndex,
      }));
    }

    return [];
  }

  private buildTicketSeatSegments(ticket: {
    id: string;
    tripId: string;
    seatId: string;
    fromStationIndex: number;
    toStationIndex: number;
  }) {
    const segments: {
      ticketId: string;
      tripId: string;
      seatId: string;
      segmentIndex: number;
    }[] = [];
    for (
      let segmentIndex = ticket.fromStationIndex;
      segmentIndex < ticket.toStationIndex;
      segmentIndex++
    ) {
      segments.push({
        ticketId: ticket.id,
        tripId: ticket.tripId,
        seatId: ticket.seatId,
        segmentIndex,
      });
    }

    return segments;
  }

  private async findPaidBookingForReceipt(bookingCode: string, tx: any = this.prisma) {
    const booking = await tx.booking.findUnique({
      where: { code: bookingCode },
      include: {
        user: true,
        trip: {
          include: {
            train: true,
            route: true,
          },
        },
        tickets: {
          include: {
            seat: {
              include: {
                coach: true,
              },
            },
          },
        },
      },
    });

    return booking?.status === 'PAID' ? booking : null;
  }

  private async releaseSeatLocks(
    tripId: string,
    segments: SeatLockSegment[],
    fallbackSeatIds: string[] = [],
  ) {
    const keys =
      segments.length > 0
        ? segments.flatMap((segment) => [
            this.buildSeatLockKey(tripId, segment),
            this.buildSeatLockPrefix(tripId, segment.seatId),
          ])
        : fallbackSeatIds.map((seatId) =>
            this.buildSeatLockPrefix(tripId, seatId),
          );

    if (keys.length === 0) return;

    await Promise.all(keys.map((key) => this.redis.del(key)));
  }

  private getCommonSegment(segments: SeatLockSegment[]) {
    const first = segments[0];
    if (!first) return undefined;

    const isSameSegment = segments.every(
      (segment) =>
        segment.fromStationIndex === first.fromStationIndex &&
        segment.toStationIndex === first.toStationIndex,
    );

    return isSameSegment
      ? {
          fromStationIndex: first.fromStationIndex,
          toStationIndex: first.toStationIndex,
        }
      : undefined;
  }

  private emitSeatLocksLocked(
    tripId: string,
    segments: SeatLockSegment[],
    fallbackSeatIds: string[],
  ) {
    this.bookingGateway.emitSeatsLocked(
      tripId,
      segments.length ? segments.map((segment) => segment.seatId) : fallbackSeatIds,
      this.getCommonSegment(segments),
    );
  }

  private emitSeatLocksReleased(
    tripId: string,
    segments: SeatLockSegment[],
    fallbackSeatIds: string[],
  ) {
    this.bookingGateway.emitSeatsReleased(
      tripId,
      segments.length ? segments.map((segment) => segment.seatId) : fallbackSeatIds,
      this.getCommonSegment(segments),
    );
  }

  private emitSeatLocksBooked(
    tripId: string,
    segments: SeatLockSegment[],
    fallbackSeatIds: string[],
  ) {
    this.bookingGateway.emitSeatsBooked(
      tripId,
      segments.length ? segments.map((segment) => segment.seatId) : fallbackSeatIds,
      this.getCommonSegment(segments),
    );
  }

  private async resolveRouteStationPair(
    routeId: string,
    routeStations: any[],
    fromStationId: string,
    toStationId: string,
  ) {
    const requestedIds = [fromStationId, toStationId].filter(Boolean);
    const requestedStations = await this.prisma.station.findMany({
      where: { id: { in: requestedIds } },
      select: { id: true, name: true },
    });
    const requestedNameById = new Map(requestedStations.map((station) => [station.id, station.name]));

    const resolve = async (stationId: string) => {
      const direct = routeStations.find((routeStation: any) => routeStation.stationId === stationId);
      if (direct) return direct;

      const stationName = requestedNameById.get(stationId);
      if (!stationName) return null;

      return (
        routeStations.find((routeStation: any) => routeStation.station?.name === stationName) ??
        this.prisma.routeStation.findFirst({
          where: {
            routeId,
            station: { name: stationName },
          },
          include: { station: true },
        })
      );
    };

    const [fromStation, toStation] = await Promise.all([resolve(fromStationId), resolve(toStationId)]);
    if (!fromStation || !toStation) {
      throw new BadRequestException('Ga đến hoặc ga đi không hợp lệ với phiên bản tuyến đường hiện tại');
    }
    if (fromStation.index >= toStation.index) {
      throw new BadRequestException('Ga đi phải đứng trước ga đến trong tuyến đường');
    }

    return { fromStation, toStation };
  }

  private withResolvedStations(metadata: any, fromStation: any, toStation: any) {
    return {
      ...metadata,
      fromStationId: fromStation.stationId,
      toStationId: toStation.stationId,
      requestedFromStationId: metadata.requestedFromStationId ?? metadata.fromStationId,
      requestedToStationId: metadata.requestedToStationId ?? metadata.toStationId,
      resolvedFromStation: this.toBookingRouteStationMetadata(fromStation),
      resolvedToStation: this.toBookingRouteStationMetadata(toStation),
    };
  }

  private toBookingRouteStationMetadata(routeStation: any) {
    return {
      stationId: routeStation.stationId,
      index: routeStation.index,
      distanceFromStart: routeStation.distanceFromStart,
      durationFromStart: routeStation.durationFromStart,
      station: routeStation.station
        ? {
            id: routeStation.station.id,
            name: routeStation.station.name,
            code: routeStation.station.code,
          }
        : undefined,
    };
  }

  private async validatePassengers(passengers: any[], passengerGroups: any[]) {
    for (const passenger of passengers) {
      const group = passengerGroups.find(
        (g) => g.id === passenger.passengerGroupId,
      );
      if (!group) continue; // Or throw error? Logic in original code skipped if not found in loop, but explicit check existed before.

      // Yêu cầu CCCD với hành khách không phải trẻ em
      if (
        group.code !== 'CHILD' &&
        (!passenger.passengerId || passenger.passengerId === 'N/A')
      ) {
        throw new BadRequestException(`Yêu cầu CCCD đối với ${group.name}`);
      }

      // Kiểm tra định dạng CCCD và độ tuổi (bỏ qua nếu là trẻ em)
      if (passenger.passengerId && passenger.passengerId !== 'N/A') {
        // Kiểm tra định dạng CCCD
        const cccdInfo = validateCCCD(passenger.passengerId);
        if (!cccdInfo.isValid) {
          throw new BadRequestException(
            `CCCD không hợp lệ cho hành khách ${passenger.passengerName}: ${cccdInfo.error}`,
          );
        }

        // Kiểm tra độ tuổi phù hợp với đối tượng
        const ageValidation = validateCCCDAgeForGroup(
          passenger.passengerId,
          group.minAge,
          group.maxAge,
        );

        if (!ageValidation.isValid) {
          throw new BadRequestException(
            `Tuổi không phù hợp với loại vé ${passenger.passengerName}: ${ageValidation.error}. ` +
              `Tuổi thực: ${ageValidation.age}, Loại vé: ${group.name} (${group.minAge ?? 'không min'}-${group.maxAge ?? 'không max'})`,
          );
        }

        // Logging handled by caller or removed to reduce noise
      }
    }
  }

  private async validateBookingPolicy(
    userId: string,
    tripId: string,
    numberOfSeats: number,
  ) {
    // 1. CHẶN SỐ LƯỢNG GHẾ (Logic đơn giản check input)
    if (numberOfSeats > 6) {
      throw new BadRequestException('Mỗi đơn hàng chỉ được đặt tối đa 6 vé.');
    }

    // Lấy danh sách các đơn đang PENDING của user này (chưa hết hạn - within 10 mins)
    // Since we have a job that runs every 10 mins to cancel, PENDING usually means active.
    // But to be precise as user requested "chưa hết hạn", let's be safe.
    const lockTimeMin =
      this.configService.get<number>('BOOKING_LOCK_TIME_MINUTES') || 10;
    const cutoffTime = dayjs().subtract(lockTimeMin, 'minute').toDate();

    const activePendingBookings = await this.prisma.booking.findMany({
      where: {
        userId: userId,
        status: 'PENDING',
        createdAt: { gt: cutoffTime }, // Chỉ tính đơn còn hiệu lực trong khoảng lock, tránh đơn bị kẹt job chưa chạy
      },
      select: { id: true, tripId: true },
    });

    // 2. CHẶN GLOBAL PENDING (Tối đa 3)
    if (activePendingBookings.length >= 3) {
      throw new BadRequestException(
        'Bạn đang giữ quá nhiều đơn chưa thanh toán (Tối đa 3 đơn). Vui lòng xử lý đơn cũ trước.',
      );
    }

    // 3. CHẶN PENDING TRÊN CÙNG CHUYẾN (Tối đa 1)
    // Check xem trong list pending, có đơn nào thuộc tripId hiện tại không?
    const isAlreadyBookingThisTrip = activePendingBookings.some(
      (b) => b.tripId === tripId,
    );

    if (isAlreadyBookingThisTrip) {
      throw new BadRequestException(
        'Bạn đã có một đơn hàng đang chờ thanh toán cho chuyến này. Vui lòng thanh toán đơn cũ hoặc hủy bỏ để đặt mới.',
      );
    }
  }
}
