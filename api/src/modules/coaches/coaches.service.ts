import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { FilterCoachDto } from './dto/filter-coach.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { Prisma, CoachLayout, CoachStatus } from '../../generated/client';

@Injectable()
export class CoachesService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  async create(createCoachDto: CreateCoachDto) {
    // Validate train exists
    const train = await this.prisma.train.findUnique({
      where: { id: createCoachDto.trainId },
    });
    if (!train) {
      throw new NotFoundException(`Tàu không tồn tại`);
    }

    // Validate template exists
    const template = await this.prisma.coachTemplate.findUnique({
      where: { id: createCoachDto.templateId },
    });
    if (!template) {
      throw new NotFoundException('Mẫu toa không tồn tại');
    }

    if (
      createCoachDto.status &&
      !Object.values(CoachStatus).includes(createCoachDto.status as CoachStatus)
    ) {
      throw new BadRequestException('Trạng thái toa không hợp lệ');
    }

    // Auto-calculate order: get max order + 1
    const maxOrderCoach = await this.prisma.coach.findFirst({
      where: { trainId: createCoachDto.trainId },
      orderBy: { order: 'desc' },
    });
    const nextOrder = maxOrderCoach ? maxOrderCoach.order + 1 : 1;

    // Create coach with auto-generated seats/beds in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create the coach with auto-generated name
      const coach = await tx.coach.create({
        data: {
          name: `Toa ${nextOrder}`, // Auto-generate name
          order: nextOrder,
          status: (createCoachDto.status as CoachStatus) || CoachStatus.ACTIVE,
          trainId: createCoachDto.trainId,
          templateId: createCoachDto.templateId,
        },
        include: {
          template: true,
        },
      });

      // Generate seats/beds based on template
      const seats = this.generateSeats(coach.id, template);

      // Delete existing seats first (in case of recreation)
      await tx.seat.deleteMany({
        where: { coachId: coach.id },
      });

      // Bulk create seats
      await tx.seat.createMany({
        data: seats,
      });

      // Return coach with seats
      return tx.coach.findUnique({
        where: { id: coach.id },
        include: {
          template: true,
          seats: true,
        },
      });
    });
  }

  async reorderCoaches(
    trainId: string,
    dto: { coaches: { coachId: string }[] },
  ) {
    // Simple sequential update with auto-generated names
    return this.prisma.$transaction(
      dto.coaches.map((item, index) =>
        this.prisma.coach.update({
          where: { id: item.coachId },
          data: {
            order: index + 1,
            name: `Toa ${index + 1}`, // Auto-generate name: Toa 1, Toa 2, etc.
          },
        }),
      ),
    );
  }

  private generateSeats(
    coachId: string,
    template: {
      layout: CoachLayout;
      totalRows: number;
      totalCols: number;
      tiers: number;
    },
  ) {
    const seats: Prisma.SeatCreateManyInput[] = [];
    let seatNumber = 1;

    if (template.layout === 'SEAT') {
      // Generate grid of seats (all tier 0)
      for (let row = 0; row < template.totalRows; row++) {
        for (let col = 0; col < template.totalCols; col++) {
          seats.push({
            name: `${seatNumber}`,
            rowIndex: row,
            colIndex: col,
            status: 'AVAILABLE',
            type: 'STANDARD',
            tier: 0, // All seats are tier 0
            coachId,
          });
          seatNumber++;
        }
      }
    } else {
      // BED layout: Generate beds for each compartment and tier
      for (let row = 0; row < template.totalRows; row++) {
        for (let tier = 0; tier < template.tiers; tier++) {
          for (let side = 0; side < 2; side++) {
            // 2 sides: left (0) and right (1)
            seats.push({
              name: `${seatNumber}`,
              rowIndex: row,
              colIndex: side,
              status: 'AVAILABLE',
              type: 'STANDARD',
              tier: tier, // Assign tier based on bed level (0=bottom, 1=middle, 2=top)
              coachId,
            });
            seatNumber++;
          }
        }
      }
    }

    return seats;
  }

  async findAll(query?: FilterCoachDto) {
    const { page = 1, limit = 10, search, trainId } = query || {};
    const skip = (page - 1) * limit;

    const where: Prisma.CoachWhereInput = {
      ...(trainId && { trainId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.coach.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query?.sort || 'order']: query?.order || 'asc',
        },
        include: {
          template: true,
          _count: {
            select: { seats: true },
          },
        },
      }),
      this.prisma.coach.count({ where }),
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
    const coach = await this.prisma.coach.findUnique({
      where: { id },
      include: {
        template: true,
        seats: true,
      },
    });

    if (!coach) {
      throw new NotFoundException('Không tìm thấy toa tàu');
    }

    return coach;
  }

  async findOneWithSeatPrice(
    id: string,
    tripId: string,
    fromStationId: string,
    toStationId: string,
  ) {
    // Get coach with template and seats
    const coach = await this.prisma.coach.findUnique({
      where: { id },
      include: {
        template: true,
        seats: true,
      },
    });

    if (!coach) {
      throw new NotFoundException('Không tìm thấy toa tàu');
    }

    // Get trip to find the route
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: {
          include: {
            stations: {
              include: { station: true },
              orderBy: {
                index: 'asc',
              },
            },
          },
        },
      },
    });

    if (!trip || !trip.route) {
      throw new NotFoundException('Không tìm thấy chuyến tàu hoặc tuyến đường');
    }

    // Fetch requested stations to get their names (for cross-network version compatibility)
    const requestedStations = await this.prisma.station.findMany({
      where: { id: { in: [fromStationId, toStationId] } }
    });
    const fromRequested = requestedStations.find(s => s.id === fromStationId);
    const toRequested = requestedStations.find(s => s.id === toStationId);

    if (!fromRequested || !toRequested) {
      throw new BadRequestException('Ga đi hoặc ga đến không hợp lệ');
    }

    // Find from and to stations by NAME to support network versioning
    const fromStation = trip.route.stations.find(
      (rs) => rs.station.name === fromRequested.name,
    );
    const toStation = trip.route.stations.find(
      (rs) => rs.station.name === toRequested.name,
    );

    if (!fromStation || !toStation) {
      throw new BadRequestException('Ga đi hoặc ga đến không thuộc tuyến đường này');
    }

    // Query booked tickets that overlap this segment.
    // Segments are half-open: [from, to), so a seat can be reused when one
    // passenger gets off at the same station another passenger gets on.
    const bookedTickets = await this.prisma.ticket.findMany({
      where: {
        tripId: tripId,
        booking: {
          status: 'PAID',
        },
        AND: [
          { fromStationIndex: { lt: toStation.index } },
          { toStationIndex: { gt: fromStation.index } },
        ],
      },
      select: {
        seatId: true,
        passengerName: true,
        passengerId: true,
        price: true, // Use the actual paid price
      },
    });

    // Create a Map for fast lookup
    const bookedSeatInfo = new Map(bookedTickets.map((t) => [t.seatId, t]));

    // Calculate price for each seat and add bookingStatus
    const seatsWithPrices = coach.seats.map((seat) => {
      const bookedTicket = bookedSeatInfo.get(seat.id);
      
      // If booked, use the actual price paid for the ticket. Otherwise, calculate current price.
      const price = bookedTicket 
        ? bookedTicket.price 
        : this.pricingService.calculateSeatPrice({
            route: {
              basePricePerKm: trip.route.basePricePerKm,
              stationFee: trip.route.stationFee,
            },
            coachTemplate: {
              coachMultiplier: coach.template.coachMultiplier,
              tierMultipliers: coach.template.tierMultipliers,
            },
            seatTier: seat.tier,
            fromStationDistance: fromStation.distanceFromStart,
            toStationDistance: toStation.distanceFromStart,
          });

      // Determine booking status
      let bookingStatus: string;
      let passenger: { name: string; id: string } | undefined = undefined;

      if (seat.status === 'DISABLED') {
        bookingStatus = 'DISABLED';
      } else if (bookedSeatInfo.has(seat.id)) {
        bookingStatus = 'BOOKED';
        const ticket = bookedSeatInfo.get(seat.id);
        if (ticket) {
          passenger = {
            name: ticket.passengerName,
            id: ticket.passengerId,
          };
        }
      } else {
        bookingStatus = 'AVAILABLE';
      }

      return {
        ...seat,
        price,
        bookingStatus,
        passenger,
      };
    });

    // Return only coach info with seats and prices (no train info)
    return {
      id: coach.id,
      name: coach.name,
      order: coach.order,
      status: coach.status,
      template: coach.template,
      seats: seatsWithPrices,
    };
  }

  async update(id: string, updateCoachDto: UpdateCoachDto) {
    // Check if coach exists
    const existing = await this.prisma.coach.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy toa tàu');
    }

    const { trainId, templateId, status, ...updateData } = updateCoachDto;
    if (status && !Object.values(CoachStatus).includes(status as CoachStatus)) {
      throw new BadRequestException('Trạng thái toa không hợp lệ');
    }

    if (
      status &&
      status !== CoachStatus.ACTIVE &&
      status !== existing.status
    ) {
      await this.assertCoachHasNoActivePaidTickets(
        id,
        'Không thể khóa toa vì toa đang có vé đã thanh toán trên chuyến chưa kết thúc.',
      );
    }

    return this.prisma.coach.update({
      where: { id },
      data: {
        ...updateData,
        ...(status && { status: status as CoachStatus }),
      },
      include: {
        template: true,
        seats: true,
      },
    });
  }

  async remove(id: string) {
    // Check if coach exists
    const existing = await this.prisma.coach.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy toa tàu');
    }

    const [ticketCount, segmentCount, issueCount] = await Promise.all([
      this.prisma.ticket.count({
        where: { seat: { coachId: id } },
      }),
      this.prisma.ticketSeatSegment.count({
        where: { seat: { coachId: id } },
      }),
      this.prisma.seatIssueReport.count({
        where: {
          OR: [
            { seat: { coachId: id } },
            { proposedSeat: { coachId: id } },
          ],
        },
      }),
    ]);

    if (ticketCount > 0 || segmentCount > 0 || issueCount > 0) {
      throw new ConflictException(
        'Không thể xóa toa đã phát sinh vé hoặc báo cáo sự cố. Hãy chuyển toa sang trạng thái bảo trì/ngừng hoạt động nếu chưa có khách đang đi.',
      );
    }

    return this.prisma.coach.delete({
      where: { id },
    });
  }

  private async assertCoachHasNoActivePaidTickets(
    coachId: string,
    message: string,
  ) {
    const activePaidTickets = await this.prisma.ticket.count({
      where: {
        seat: { coachId },
        booking: { status: 'PAID' },
        trip: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      },
    });

    if (activePaidTickets > 0) {
      throw new ConflictException(message);
    }
  }
}
