import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma, SeatIssueStatus, SeatStatus } from '../../generated/client';
import { BookingGateway } from '../booking/booking.gateway';
import dayjs from 'dayjs';
import * as crypto from 'crypto';

@Injectable()
export class SeatIssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly bookingGateway: BookingGateway,
  ) {}

  private isTripReportable(trip: { status: string; endTime: Date }) {
    return ['SCHEDULED', 'IN_PROGRESS'].includes(trip.status) && new Date() <= new Date(trip.endTime);
  }

  // 1. Get driver assigned trips
  async getDriverTrips(driverId: string) {
    const trips = await this.prisma.trip.findMany({
      where: { driverId },
      include: {
        route: true,
        train: {
          include: {
            coaches: {
              include: {
                template: true,
                seats: true,
              },
            },
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    return trips.map((trip) => ({
      ...trip,
      canReportSeatIssue: this.isTripReportable(trip),
    }));
  }

  // 1b. Get specific driver trip detail with seat booking tickets
  async getDriverTripDetail(tripId: string, driverId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, driverId },
      include: {
        route: {
          include: {
            stations: {
              include: {
                station: true,
              },
              orderBy: { index: 'asc' },
            },
          },
        },
        train: {
          include: {
            coaches: {
              include: {
                template: true,
                _count: {
                  select: {
                    seats: true,
                  },
                },
                seats: {
                  include: {
                    tickets: {
                      where: {
                        tripId,
                        booking: {
                          status: 'PAID',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip #${tripId} not found or not assigned to you`);
    }

    return {
      ...trip,
      canReportSeatIssue: this.isTripReportable(trip),
    };
  }

  // 2. Get reported issues by driver
  async getDriverIssues(driverId: string) {
    return this.prisma.seatIssueReport.findMany({
      where: { reportedById: driverId },
      include: {
        seat: {
          include: {
            coach: true,
          },
        },
        trip: {
          include: {
            route: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Create driver issue report
  async createDriverIssue(
    driverId: string,
    data: { tripId: string; seatId: string; issueType: string; description: string },
  ) {
    const { tripId, seatId, issueType, description } = data;

    // Check if trip exists and driver is assigned
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        train: {
          include: {
            coaches: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip #${tripId} not found`);
    }

    if (trip.driverId !== driverId) {
      throw new BadRequestException('Bạn không được phân công điều khiển chuyến đi này');
    }

    if (!this.isTripReportable(trip)) {
      throw new BadRequestException('Chuyến tàu đã kết thúc hoặc không còn hoạt động. Không thể báo cáo sự cố ghế.');
    }

    // Check if seat exists
    const seat = await this.prisma.seat.findUnique({
      where: { id: seatId },
      include: {
        coach: {
          select: { trainId: true },
        },
      },
    });

    if (!seat) {
      throw new NotFoundException(`Seat #${seatId} not found`);
    }

    if (seat.coach.trainId !== trip.trainId) {
      throw new BadRequestException('Selected seat does not belong to this trip train.');
    }

    const existingOpenIssue = await this.prisma.seatIssueReport.findFirst({
      where: {
        tripId,
        seatId,
        status: {
          in: [SeatIssueStatus.PENDING, SeatIssueStatus.WAITING_CUSTOMER_CONFIRMATION],
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingOpenIssue) {
      throw new ConflictException('Ghế này đã có báo cáo sự cố đang chờ xử lý. Không thể gửi trùng báo cáo.');
    }

    // Create the issue report in PENDING state
    const report = await this.prisma.seatIssueReport.create({
      data: {
        tripId,
        seatId,
        issueType,
        description,
        reportedById: driverId,
        status: SeatIssueStatus.PENDING,
      },
      include: {
        seat: {
          include: {
            coach: true,
          },
        },
        trip: {
          include: {
            route: true,
          },
        },
      },
    });

    // Emit real-time update
    this.bookingGateway.emitSeatIssuesUpdated(tripId, seatId, 'PENDING');

    return report;
  }

  // 4. Get all issues for Admin
  async getAdminIssues() {
    return this.prisma.seatIssueReport.findMany({
      include: {
        seat: {
          include: {
            coach: {
              include: {
                train: true,
              },
            },
          },
        },
        trip: {
          select: {
            id: true,
            status: true,
            departureTime: true,
            endTime: true,
          },
        },
        reportedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        proposedSeat: {
          include: {
            coach: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4b. Get specific issue detail for Admin
  async getAdminIssueDetail(id: string) {
    const issue = await this.prisma.seatIssueReport.findUnique({
      where: { id },
      include: {
        seat: {
          include: {
            coach: {
              include: {
                train: true,
              },
            },
          },
        },
        trip: {
          include: {
            route: {
              include: {
                stations: {
                  include: {
                    station: true,
                  },
                  orderBy: { index: 'asc' },
                },
              },
            },
            train: {
              include: {
                coaches: {
                  include: {
                    template: true,
                    _count: {
                      select: {
                        seats: true,
                      },
                    },
                  },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        reportedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        proposedSeat: {
          include: {
            coach: true,
          },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException(`Issue report #${id} not found`);
    }

    return issue;
  }

  // 5. Reject issue report
  async rejectIssue(id: string, rejectReason: string) {
    const report = await this.prisma.seatIssueReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Issue report #${id} not found`);
    }

    if (report.status !== SeatIssueStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể từ chối báo cáo ở trạng thái PENDING');
    }

    const updated = await this.prisma.seatIssueReport.update({
      where: { id },
      data: {
        status: SeatIssueStatus.REJECTED,
        rejectReason,
      },
    });

    // Emit real-time update
    this.bookingGateway.emitSeatIssuesUpdated(updated.tripId, updated.seatId, 'REJECTED');

    return updated;
  }

  // 6. Confirm issue report (and try to auto-replace seat)
  async confirmIssue(id: string) {
    const report = await this.prisma.seatIssueReport.findUnique({
      where: { id },
      include: {
        seat: {
          include: {
            coach: true,
          },
        },
        trip: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Issue report #${id} not found`);
    }

    if (report.status !== SeatIssueStatus.PENDING) {
      throw new BadRequestException('Báo cáo đã được xử lý từ trước');
    }

    // Set physical seat to DISABLED/MAINTENANCE in database
    await this.prisma.seat.update({
      where: { id: report.seatId },
      data: { status: SeatStatus.DISABLED },
    });

    // Check if there are any PAID tickets affected on this trip and seat
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        tripId: report.tripId,
        seatId: report.seatId,
        booking: {
          status: 'PAID',
        },
      },
      include: {
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    // If no customer ticket is affected, resolve immediately
    if (!ticket) {
      await this.prisma.seatIssueReport.update({
        where: { id },
        data: { status: SeatIssueStatus.RESOLVED },
      });
      // Emit real-time update
      this.bookingGateway.emitSeatIssuesUpdated(report.tripId, report.seatId, 'RESOLVED');

      return { status: 'RESOLVED', message: 'Xác nhận sự cố thành công (Không có vé bị ảnh hưởng)' };
    }

    // Find equivalent empty seats
    const replacementSeat = await this.findAlternativeSeat(
      report.tripId,
      report.seatId,
      report.seat,
    );

    if (replacementSeat) {
      const token = crypto.randomUUID();
      const tokenExpires = dayjs().add(24, 'hour').toDate();

      await this.prisma.seatIssueReport.update({
        where: { id },
        data: {
          status: SeatIssueStatus.WAITING_CUSTOMER_CONFIRMATION,
          token,
          tokenExpires,
          proposedSeatId: replacementSeat.id,
        },
      });

      // Send alert email to customer
      const customerEmail = ticket.booking.contactEmail || ticket.booking.user?.email;
      if (customerEmail) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
        const link = `${frontendUrl}/confirm-seat-replacement?token=${token}`;

        await this.mailService.sendSeatReplacementEmail(customerEmail, {
          link,
          oldSeatName: report.seat.name,
          oldCoachName: report.seat.coach?.name || report.seat.coach?.order,
          proposedSeatName: replacementSeat.name,
          proposedCoachName: replacementSeat.coach?.name || replacementSeat.coach?.order,
          tokenExpires,
        });
      }

      // Emit real-time update
      this.bookingGateway.emitSeatIssuesUpdated(report.tripId, report.seatId, 'WAITING_CUSTOMER_CONFIRMATION');

      return {
        status: 'WAITING_CUSTOMER_CONFIRMATION',
        proposedSeat: replacementSeat,
        message: 'Đã tìm thấy ghế đề xuất và gửi email xác thực cho khách hàng',
      };
    }

    const refundResult = await this.refundAffectedTicket(id, 'NO_REPLACEMENT_AUTO_REFUND');
    return {
      ...refundResult,
      message: 'Không tìm thấy ghế thay thế phù hợp. Hệ thống đã tự động hủy vé và hoàn tiền cho khách hàng.',
    };
  }

  // Find alternative equivalent empty seats
  private async findAlternativeSeat(tripId: string, oldSeatId: string, oldSeat: any) {
    // Query train and all its active seats matching:
    // - Same layout/type (standard, economy, standard layout BED/SEAT)
    // - Same tier (tier)
    // Let's find all seats in coaches of the train running this trip
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        train: {
          include: {
            coaches: {
              where: {
                status: 'ACTIVE',
              },
              include: {
                seats: {
                  where: {
                    status: 'AVAILABLE',
                    type: oldSeat.type,
                    tier: oldSeat.tier,
                    id: { not: oldSeatId },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!trip) return null;

    // Get all candidate seats
    const candidates: any[] = [];
    trip.train.coaches.forEach((coach) => {
      coach.seats.forEach((seat) => {
        candidates.push({ ...seat, coach });
      });
    });

    if (candidates.length === 0) return null;

    // Filter out seats that have booked tickets on this specific trip
    const bookedTickets = await this.prisma.ticket.findMany({
      where: {
        tripId,
        booking: {
          status: { in: ['PAID', 'PENDING'] },
        },
      },
      select: {
        seatId: true,
      },
    });

    const bookedSeatIds = new Set(bookedTickets.map((t) => t.seatId));
    const availableCandidates = candidates.filter((c) => !bookedSeatIds.has(c.id));

    if (availableCandidates.length === 0) return null;

    // Sort: 1. Same coach first, 2. Closest rowIndex/colIndex
    availableCandidates.sort((a, b) => {
      const aSameCoach = a.coachId === oldSeat.coachId ? 1 : 0;
      const bSameCoach = b.coachId === oldSeat.coachId ? 1 : 0;

      if (aSameCoach !== bSameCoach) {
        return bSameCoach - aSameCoach; // true first
      }

      // Same coach or both different, sort by distance in rowIndex/colIndex
      const distA = Math.abs(a.rowIndex - oldSeat.rowIndex) + Math.abs(a.colIndex - oldSeat.colIndex);
      const distB = Math.abs(b.rowIndex - oldSeat.rowIndex) + Math.abs(b.colIndex - oldSeat.colIndex);
      return distA - distB;
    });

    return availableCandidates[0];
  }

  private async refundAffectedTicket(id: string, reason: string) {
    const report = await this.prisma.seatIssueReport.findUnique({
      where: { id },
      include: {
        seat: true,
        trip: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Issue report #${id} not found`);
    }

    // Find affected ticket
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        tripId: report.tripId,
        seatId: report.seatId,
        booking: {
          status: 'PAID',
        },
      },
      include: {
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!ticket) {
      await this.prisma.seatIssueReport.update({
        where: { id },
        data: {
          status: SeatIssueStatus.RESOLVED,
          token: null,
          tokenExpires: null,
          rejectReason: reason,
        },
      });
      this.bookingGateway.emitSeatIssuesUpdated(report.tripId, report.seatId, 'RESOLVED');
      return { status: 'RESOLVED', refundAmount: 0 };
    }

    const refundAmount = ticket.price;
    const userId = ticket.booking.userId;

    if (!userId) {
      throw new BadRequestException('Vé không liên kết với tài khoản người dùng nội bộ để hoàn tiền ví');
    }

    // Perform refund in transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Refund to user wallet balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: refundAmount },
        },
      });

      // 2. Create Transaction record
      await tx.transaction.create({
        data: {
          userId,
          amount: refundAmount,
          type: 'REFUND',
          paymentMethod: 'WALLET',
          status: 'COMPLETED',
          referenceId: ticket.bookingId,
          idempotencyKey: `SEAT_ISSUE_REFUND:${id}:${ticket.id}`,
          description: `Hoàn tiền sự cố ghế hỏng #${report.seat.name} chuyến ${report.tripId}`,
        },
      });

      // 3. Release occupied segments so the seat can be sold again.
      await tx.ticketSeatSegment.deleteMany({
        where: { ticketId: ticket.id },
      });

      // 4. Mark ticket and booking cancelled
      await tx.booking.update({
        where: { id: ticket.bookingId },
        data: {
          status: 'CANCELLED',
        },
      });

      // 5. Update Issue Report status to RESOLVED
      await tx.seatIssueReport.update({
        where: { id },
        data: {
          status: SeatIssueStatus.RESOLVED,
          token: null,
          tokenExpires: null,
          rejectReason: reason,
        },
      });
    });

    // Send email refund confirmation
    const customerEmail = ticket.booking.contactEmail || ticket.booking.user?.email;
    if (customerEmail) {
      await this.mailService.sendSeatIssueRefundEmail(customerEmail, {
        refundAmount,
        bookingCode: ticket.booking.code,
      });
    }

    // Emit real-time update
    this.bookingGateway.emitSeatIssuesUpdated(report.tripId, report.seatId, 'RESOLVED');

    return { status: 'RESOLVED', refundAmount, message: 'Hoàn tiền và hủy vé thành công!' };
  }

  async rejectReplacement(token: string) {
    const report = await this.prisma.seatIssueReport.findUnique({
      where: { token },
    });

    if (!report) {
      throw new NotFoundException('Token đổi ghế không hợp lệ');
    }

    if (report.status !== SeatIssueStatus.WAITING_CUSTOMER_CONFIRMATION) {
      throw new BadRequestException('Yêu cầu đổi ghế đã được xử lý hoặc hết hạn');
    }

    return this.refundAffectedTicket(report.id, 'CUSTOMER_REJECTED_REPLACEMENT');
  }

  async refundExpiredReplacement(id: string) {
    return this.refundAffectedTicket(id, 'EXPIRED_AUTO_REFUND');
  }

  // 8. Load replacement options by token
  async getReplacementOptions(token: string) {
    const report = await this.prisma.seatIssueReport.findUnique({
      where: { token },
      include: {
        seat: {
          include: {
            coach: true,
          },
        },
        proposedSeat: {
          include: {
            coach: true,
          },
        },
        trip: {
          include: {
            route: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Token đổi ghế không hợp lệ');
    }

    if (report.status !== SeatIssueStatus.WAITING_CUSTOMER_CONFIRMATION) {
      throw new BadRequestException('Sự cố này đã được giải quyết hoặc hết hạn');
    }

    if (report.tokenExpires && new Date() > report.tokenExpires) {
      throw new BadRequestException('Token đổi ghế đã hết hạn 24 giờ.');
    }

    // Find ticket info
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        tripId: report.tripId,
        seatId: report.seatId,
        booking: {
          status: 'PAID',
        },
      },
      include: {
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Không tìm thấy vé liên quan');
    }

    // Offer proposed seat and up to 4 other equivalent seats
    const alternatives = await this.prisma.seat.findMany({
      where: {
        coach: {
          trainId: report.trip.trainId,
          status: 'ACTIVE',
        },
        status: 'AVAILABLE',
        type: report.seat.type,
        tier: report.seat.tier,
        id: { not: report.seatId },
      },
      include: {
        coach: true,
      },
      take: 10, // Fetch some candidates
    });

    // Filter booked seats
    const bookedTickets = await this.prisma.ticket.findMany({
      where: {
        tripId: report.tripId,
        booking: {
          status: { in: ['PAID', 'PENDING'] },
        },
      },
      select: {
        seatId: true,
      },
    });

    const bookedSeatIds = new Set(bookedTickets.map((t) => t.seatId));
    const availableSeats = alternatives.filter((s) => !bookedSeatIds.has(s.id));

    // Ensure proposed seat is first
    const proposedSeat = report.proposedSeat;
    let finalOptions: any[] = [];
    if (proposedSeat) {
      finalOptions.push(proposedSeat);
    }

    availableSeats.forEach((seat) => {
      if (seat.id !== proposedSeat?.id && finalOptions.length < 5) {
        finalOptions.push(seat);
      }
    });

    return {
      report,
      ticket,
      options: finalOptions,
    };
  }

  // 9. Customer confirms seat replacement selection
  async confirmReplacement(token: string, newSeatId: string) {
    const report = await this.prisma.seatIssueReport.findUnique({
      where: { token },
      include: {
        seat: true,
        trip: {
          select: {
            trainId: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Token đổi ghế không hợp lệ');
    }

    if (report.status !== SeatIssueStatus.WAITING_CUSTOMER_CONFIRMATION) {
      throw new BadRequestException('Yêu cầu đổi ghế đã được xử lý hoặc hết hạn');
    }

    if (report.tokenExpires && new Date() > report.tokenExpires) {
      throw new BadRequestException('Mã xác nhận đổi ghế đã hết hạn');
    }

    // Find affected ticket
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        tripId: report.tripId,
        seatId: report.seatId,
        booking: {
          status: 'PAID',
        },
      },
      include: {
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Không tìm thấy vé hợp lệ');
    }

    // Double check that the new seat is still empty on the affected segment.
    const alreadyBooked = await this.prisma.ticketSeatSegment.findFirst({
      where: {
        tripId: report.tripId,
        seatId: newSeatId,
        segmentIndex: {
          gte: ticket.fromStationIndex,
          lt: ticket.toStationIndex,
        },
        ticket: {
          booking: {
            status: 'PAID',
          },
        },
      },
    });

    if (alreadyBooked) {
      throw new ConflictException('Ghế ngồi này đã bị hành khách khác chọn trước. Vui lòng chọn ghế khác.');
    }

    const newSeat = await this.prisma.seat.findUnique({
      where: { id: newSeatId },
      include: {
        coach: true,
      },
    });

    if (!newSeat) {
      throw new NotFoundException(`Seat #${newSeatId} not found`);
    }

    if (
      newSeat.status !== 'AVAILABLE' ||
      newSeat.type !== report.seat.type ||
      newSeat.tier !== report.seat.tier ||
      newSeat.coach.trainId !== report.trip.trainId
    ) {
      throw new BadRequestException('Selected seat is not a valid replacement option.');
    }

    try {
      await this.prisma.$transaction(
        async (tx) => {
          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              seatId: newSeatId,
            },
          });

          await tx.ticketSeatSegment.deleteMany({
            where: { ticketId: ticket.id },
          });

          await tx.ticketSeatSegment.createMany({
            data: this.buildTicketSeatSegments({
              id: ticket.id,
              tripId: ticket.tripId,
              seatId: newSeatId,
              fromStationIndex: ticket.fromStationIndex,
              toStationIndex: ticket.toStationIndex,
            }),
          });

          await tx.seatIssueReport.update({
            where: { id: report.id },
            data: {
              status: SeatIssueStatus.RESOLVED,
              token: null,
              tokenExpires: null,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Ghế ngồi này đã bị hành khách khác chọn trước. Vui lòng chọn ghế khác.');
      }
      throw error;
    }

    // Emit real-time updates for seat status change
    this.bookingGateway.emitSeatIssuesUpdated(report.tripId, report.seatId, 'RESOLVED');
    this.bookingGateway.emitSeatsBooked(report.tripId, [newSeatId]);

    const customerEmail = ticket.booking.contactEmail || ticket.booking.user?.email;
    if (customerEmail) {
      await this.mailService.sendSeatReplacementSuccessEmail(customerEmail, {
        newSeatName: newSeat.name,
        newCoachName: newSeat.coach?.name || newSeat.coach?.order,
      });
    }

    return { success: true, message: 'Đổi ghế thành công!' };
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
}
