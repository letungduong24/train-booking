import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { FilterCoachDto } from './dto/filter-coach.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { Prisma, CoachLayout } from '../../generated/client';

@Injectable()
export class CoachesService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) { }

  async create(createCoachDto: CreateCoachDto) {
    // Validate train exists
    const train = await this.prisma.train.findUnique({
      where: { id: createCoachDto.trainId }
    });
    if (!train) {
      throw new NotFoundException(`Tàu không tồn tại`);
    }

    // Validate template exists
    const template = await this.prisma.coachTemplate.findUnique({
      where: { id: createCoachDto.templateId }
    });
    if (!template) {
      throw new NotFoundException(`Template không tồn tại`);
    }

    // Auto-calculate order: get max order + 1
    const maxOrderCoach = await this.prisma.coach.findFirst({
      where: { trainId: createCoachDto.trainId },
      orderBy: { order: 'desc' }
    });
    const nextOrder = maxOrderCoach ? maxOrderCoach.order + 1 : 1;

    // Create coach with auto-generated seats/beds in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create the coach with auto-generated name
      const coach = await tx.coach.create({
        data: {
          name: `Toa ${nextOrder}`, // Auto-generate name
          order: nextOrder,
          status: createCoachDto.status || 'ACTIVE',
          trainId: createCoachDto.trainId,
          templateId: createCoachDto.templateId,
        },
        include: {
          template: true,
        }
      });

      // Generate seats/beds based on template
      const seats = this.generateSeats(coach.id, template);

      // Delete existing seats first (in case of recreation)
      await tx.seat.deleteMany({
        where: { coachId: coach.id }
      });

      // Bulk create seats
      await tx.seat.createMany({
        data: seats
      });

      // Return coach with seats
      return tx.coach.findUnique({
        where: { id: coach.id },
        include: {
          template: true,
          seats: true,
        }
      });
    });
  }

  async reorderCoaches(trainId: string, dto: { coaches: { coachId: string }[] }) {
    // Simple sequential update with auto-generated names
    return this.prisma.$transaction(
      dto.coaches.map((item, index) =>
        this.prisma.coach.update({
          where: { id: item.coachId },
          data: {
            order: index + 1,
            name: `Toa ${index + 1}` // Auto-generate name: Toa 1, Toa 2, etc.
          }
        })
      )
    );
  }

  private generateSeats(
    coachId: string,
    template: { layout: CoachLayout; totalRows: number; totalCols: number; tiers: number }
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
          [query?.sort || 'order']: query?.order || 'asc'
        },
        include: {
          template: true,
          _count: {
            select: { seats: true }
          }
        }
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
      }
    });

    if (!coach) {
      throw new NotFoundException(`Coach #${id} not found`);
    }

    return coach;
  }

  async findOneWithSeatPrice(id: string, tripId: string, fromStationId: string, toStationId: string) {
    // Get coach with template and seats
    const coach = await this.prisma.coach.findUnique({
      where: { id },
      include: {
        template: true,
        seats: true,
      },
    });

    if (!coach) {
      throw new NotFoundException(`Coach #${id} not found`);
    }

    // Get trip to find the route
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: {
          include: {
            stations: {
              orderBy: {
                index: 'asc',
              },
            },
          },
        },
      },
    });

    if (!trip || !trip.route) {
      throw new NotFoundException(`Trip or route not found`);
    }

    // Find from and to stations
    const fromStation = trip.route.stations.find(
      (rs) => rs.stationId === fromStationId,
    );
    const toStation = trip.route.stations.find(
      (rs) => rs.stationId === toStationId,
    );

    if (!fromStation || !toStation) {
      throw new BadRequestException('Invalid station IDs');
    }

    // Query all booked tickets for this trip that overlap with the requested segment
    const bookedTickets = await this.prisma.ticket.findMany({
      where: {
        tripId: tripId,
        // Check overlap: new segment overlaps with already booked segment
        AND: [
          { fromStationIndex: { lte: toStation.index } },
          { toStationIndex: { gte: fromStation.index } }
        ]
      },
      select: {
        seatId: true,
      }
    });

    // Create a Set for fast lookup
    const bookedSeatIds = new Set(bookedTickets.map(t => t.seatId));

    // Calculate price for each seat and add bookingStatus
    const seatsWithPrices = coach.seats.map((seat) => {
      const price = this.pricingService.calculateSeatPrice({
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
      if (seat.status === 'LOCKED') {
        bookingStatus = 'LOCKED';
      } else if (bookedSeatIds.has(seat.id)) {
        bookingStatus = 'BOOKED';
      } else {
        bookingStatus = 'AVAILABLE';
      }

      return {
        ...seat,
        price,
        bookingStatus,
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
      where: { id }
    });
    if (!existing) {
      throw new NotFoundException(`Coach #${id} not found`);
    }

    return this.prisma.coach.update({
      where: { id },
      data: updateCoachDto,
      include: {
        template: true,
        seats: true,
      }
    });
  }

  async remove(id: string) {
    // Check if coach exists
    const existing = await this.prisma.coach.findUnique({
      where: { id }
    });
    if (!existing) {
      throw new NotFoundException(`Coach #${id} not found`);
    }

    // Delete coach (seats will cascade automatically)
    return this.prisma.coach.delete({
      where: { id },
    });
  }
}
