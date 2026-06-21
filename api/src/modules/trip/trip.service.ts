import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FilterTripDto } from './dto/filter-trip.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TripStatus } from '../../generated/client';
import { calculateLiveLocationSnapshot } from './utils/live-location-calculator';

@Injectable()
export class TripService {
  constructor(private prisma: PrismaService) { }

  async create(createTripDto: CreateTripDto) {
    // Validate route exists
    const route = await this.prisma.route.findUnique({
      where: { id: createTripDto.routeId },
    });
    if (!route) {
      throw new BadRequestException('Route không tồn tại');
    }

    // Validate train exists
    const train = await this.prisma.train.findUnique({
      where: { id: createTripDto.trainId },
    });
    if (!train) {
      throw new BadRequestException('Train không tồn tại');
    }

    // Validate driver if provided
    if (createTripDto.driverId) {
      const driver = await this.prisma.user.findUnique({
        where: { id: createTripDto.driverId, role: 'DRIVER' },
      });
      if (!driver) {
        throw new BadRequestException('Lái tàu không tồn tại hoặc không hợp lệ');
      }
    }

    // Calculate duration based on train average speed and route distance
    let durationMinutes = route.durationMinutes;
    if (route.totalDistanceKm > 0 && train.averageSpeedKmH > 0) {
      durationMinutes = Math.round((route.totalDistanceKm / train.averageSpeedKmH) * 60);
    }

    // Calculate endTime
    const departureTime = new Date(createTripDto.departureTime);
    const durationMs = durationMinutes * 60 * 1000;
    const turnaroundMs = route.turnaroundMinutes * 60 * 1000;
    const endTime = new Date(
      departureTime.getTime() + durationMs + turnaroundMs,
    );

    // Check for overlaps
    const existingTrip = await this.prisma.trip.findFirst({
      where: {
        trainId: createTripDto.trainId,
        status: { not: TripStatus.CANCELLED },
        OR: [
          {
            // New trip starts during existing trip
            departureTime: {
              gte: departureTime,
              lt: endTime,
            },
          },
          {
            // New trip ends during existing trip
            endTime: {
              gt: departureTime,
              lte: endTime,
            },
          },
          {
            // New trip encompasses existing trip
            departureTime: { lte: departureTime },
            endTime: { gte: endTime },
          },
        ],
      },
    });

    if (existingTrip) {
      throw new BadRequestException(
        'Tàu này đã có chuyến đi khác trong khoảng thời gian này',
      );
    }

    return this.prisma.trip.create({
      data: {
        routeId: createTripDto.routeId,
        trainId: createTripDto.trainId,
        departureTime,
        endTime,
        status: TripStatus.SCHEDULED,
        ...(createTripDto.driverId && { driverId: createTripDto.driverId }),
      },
      include: {
        route: true,
        train: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(query: FilterTripDto = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      routeId,
      trainId,
      departureTime,
      status,
      upcoming,
    } = query;
    const skip = (page - 1) * limit;

    const andConditions: Prisma.TripWhereInput[] = [];

    if (departureTime) {
      const startOfDay = new Date(departureTime);
      andConditions.push({
        departureTime: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    }

    if (upcoming) {
      andConditions.push({
        departureTime: {
          gte: new Date(),
        },
      });
    }

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
      ...(andConditions.length > 0 && { AND: andConditions }),
      ...(status
        ? { status: status as TripStatus }
        : upcoming
          ? { status: { not: TripStatus.CANCELLED } }
          : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sort || 'departureTime']: query.order || 'desc',
        },
        include: {
          route: {
            include: {
              stations: {
                select: {
                  stationId: true,
                  index: true,
                },
                orderBy: {
                  index: 'asc',
                },
              },
            },
          },
          train: true,
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
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

  async findOne(id: string, from?: string, to?: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            stations: {
              include: {
                station: true,
              },
              orderBy: {
                index: 'asc',
              },
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
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip #${id} không tồn tại`);
    }

    let resolvedFrom: any = null;
    let resolvedTo: any = null;

    if (from && to) {
      const requestedStations = await this.prisma.station.findMany({
        where: { id: { in: [from, to] } }
      });
      const fromReq = requestedStations.find(s => s.id === from);
      const toReq = requestedStations.find(s => s.id === to);

      if (fromReq && toReq && trip.route) {
        resolvedFrom = trip.route.stations.find(rs => rs.station.name === fromReq.name) || null;
        resolvedTo = trip.route.stations.find(rs => rs.station.name === toReq.name) || null;
      }
    }

    return {
      ...trip,
      resolvedFrom,
      resolvedTo,
    };
  }

  async update(id: string, updateTripDto: UpdateTripDto) {
    // Check if trip exists
    await this.findOne(id);

    // Validate route if provided
    if (updateTripDto.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: updateTripDto.routeId },
      });
      if (!route) {
        throw new BadRequestException('Route không tồn tại');
      }
    }

    // Validate train if provided
    if (updateTripDto.trainId) {
      const train = await this.prisma.train.findUnique({
        where: { id: updateTripDto.trainId },
      });
      if (!train) {
        throw new BadRequestException('Train không tồn tại');
      }
    }

    // Validate driver if provided
    let driverIdUpdate: string | null | undefined = undefined;
    if (updateTripDto.driverId !== undefined) {
      if (updateTripDto.driverId === null || updateTripDto.driverId === '') {
        driverIdUpdate = null;
      } else {
        const driver = await this.prisma.user.findUnique({
          where: { id: updateTripDto.driverId, role: 'DRIVER' },
        });
        if (!driver) {
          throw new BadRequestException('Lái tàu không tồn tại hoặc không hợp lệ');
        }
        driverIdUpdate = updateTripDto.driverId;
      }
    }

    // Calculate new trip details
    const trip = await this.prisma.trip.findUnique({ where: { id } });
    if (!trip) {
      throw new NotFoundException(`Trip #${id} không tồn tại`);
    }

    const routeId = updateTripDto.routeId || trip.routeId;
    const trainId = updateTripDto.trainId || trip.trainId;
    const departureTime = updateTripDto.departureTime
      ? new Date(updateTripDto.departureTime)
      : trip.departureTime;

    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
    });
    if (!route) {
      throw new BadRequestException('Route không tồn tại');
    }

    const train = await this.prisma.train.findUnique({
      where: { id: trainId },
    });
    if (!train) {
      throw new BadRequestException('Train không tồn tại');
    }

    let durationMinutes = route.durationMinutes;
    if (route.totalDistanceKm > 0 && train.averageSpeedKmH > 0) {
      durationMinutes = Math.round((route.totalDistanceKm / train.averageSpeedKmH) * 60);
    }

    const durationMs = durationMinutes * 60 * 1000;
    const turnaroundMs = route.turnaroundMinutes * 60 * 1000;
    const endTime = new Date(
      departureTime.getTime() + durationMs + turnaroundMs,
    );

    // Check for overlaps (excluding current trip)
    const existingTrip = await this.prisma.trip.findFirst({
      where: {
        id: { not: id },
        trainId: trainId,
        status: { not: 'CANCELLED' },
        OR: [
          { departureTime: { gte: departureTime, lt: endTime } },
          { endTime: { gt: departureTime, lte: endTime } },
          { departureTime: { lte: departureTime }, endTime: { gte: endTime } },
        ],
      },
    });

    if (existingTrip) {
      throw new BadRequestException(
        'Tàu này đã có chuyến đi khác trong khoảng thời gian này',
      );
    }

    return this.prisma.trip.update({
      where: { id },
      data: {
        ...(updateTripDto.routeId && { routeId: updateTripDto.routeId }),
        ...(updateTripDto.trainId && { trainId: updateTripDto.trainId }),
        ...(updateTripDto.departureTime && { departureTime }),
        ...(driverIdUpdate !== undefined && { driverId: driverIdUpdate }),
        endTime, // Always update endTime
      },
      include: {
        route: true,
        train: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async searchTrips(fromStationId: string, toStationId: string, date: string) {
    const fromStation = await this.prisma.station.findUnique({ where: { id: fromStationId } });
    const toStation = await this.prisma.station.findUnique({ where: { id: toStationId } });

    if (!fromStation || !toStation) {
      return [];
    }

    // Step 1: Find all routes containing both stations by name (cross-network compatibility)
    const routes = await this.prisma.route.findMany({
      where: {
        AND: [
          {
            stations: {
              some: {
                station: { name: fromStation.name },
              },
            },
          },
          {
            stations: {
              some: {
                station: { name: toStation.name },
              },
            },
          },
        ],
      },
      include: {
        stations: {
          include: { station: true },
          orderBy: {
            index: 'asc',
          },
        },
      },
    });

    // Step 2: Filter routes where fromStation.index < toStation.index (correct direction)
    const validRouteIds = routes
      .filter((route) => {
        const fromRS = route.stations.find(
          (rs) => rs.station.name === fromStation.name,
        );
        const toRS = route.stations.find(
          (rs) => rs.station.name === toStation.name,
        );
        return fromRS && toRS && fromRS.index < toRS.index;
      })
      .map((route) => route.id);

    if (validRouteIds.length === 0) {
      return [];
    }

    // Step 3: Find trips on those routes matching a broad range (+/- 5 days to cover intermediate offsets)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfRange = new Date(startOfDay);
    startOfRange.setDate(startOfRange.getDate() - 5);

    const endOfRange = new Date(endOfDay);
    endOfRange.setDate(endOfRange.getDate() + 4);

    const allTrips = await this.prisma.trip.findMany({
      where: {
        routeId: {
          in: validRouteIds,
        },
        departureTime: {
          gte: startOfRange,
          lte: endOfRange,
          gt: new Date(),
        },
        status: TripStatus.SCHEDULED,
      },
      include: {
        route: {
          include: {
            stations: {
              include: {
                station: true,
              },
              orderBy: {
                index: 'asc',
              },
            },
          },
        },
        train: {
          include: {
            coaches: {
              include: {
                _count: {
                  select: {
                    seats: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        departureTime: 'asc',
      },
    });

    // Step 4: Map trips with resolved stations and calculate actual local departure at the station
    const mappedTrips = allTrips.map((trip) => {
      const resolvedFrom = trip.route.stations.find(
        (rs) => rs.station.name === fromStation.name,
      ) || null;
      const resolvedTo = trip.route.stations.find(
        (rs) => rs.station.name === toStation.name,
      ) || null;

      const durationFromStart = resolvedFrom?.durationFromStart ?? 0;
      const actualDeparture = new Date(trip.departureTime.getTime() + durationFromStart * 60 * 1000);
      
      // Calculate local YYYY-MM-DD date in GMT+7 (Vietnam)
      const localDateStr = new Date(actualDeparture.getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      return {
        ...trip,
        resolvedFrom,
        resolvedTo,
        localDateStr,
      };
    });

    // Step 5: Filter exact matches (localDateStr matches query date)
    const exactTrips = mappedTrips.filter((t) => t.localDateStr === date);

    if (exactTrips.length > 0) {
      return exactTrips.map(({ localDateStr, ...trip }) => trip);
    }

    // Step 6: Fallback to nearby matches within +/- 3 days
    const getDayDiff = (d1: string, d2: string) => {
      const time1 = new Date(d1).getTime();
      const time2 = new Date(d2).getTime();
      return Math.abs(time1 - time2) / (1000 * 60 * 60 * 24);
    };

    const nearbyTrips = mappedTrips.filter((t) => {
      const diff = getDayDiff(t.localDateStr, date);
      return diff <= 3;
    });

    return nearbyTrips.map(({ localDateStr, ...trip }) => trip);
  }

  async remove(id: string) {
    // Check if trip exists
    await this.findOne(id);

    return this.prisma.trip.delete({
      where: { id },
    });
  }

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

    if (trip.status !== TripStatus.SCHEDULED) {
      throw new BadRequestException(
        'Chỉ có thể set departure delay cho chuyến SCHEDULED',
      );
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

    if (trip.status !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Chỉ có thể set arrival delay cho chuyến IN_PROGRESS',
      );
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

  async getTripStats(id: string) {
    // 1. Get Trip with Train/Coach info for total seats
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        train: {
          include: {
            coaches: {
              include: {
                _count: {
                  select: { seats: true },
                },
              },
            },
          },
        },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    const totalSeats = trip.train.coaches.reduce(
      (sum, coach) => sum + (coach._count.seats || 0),
      0,
    );

    // 2. Aggregate Booking Data (Real-time from Bookings)
    const bookings = await this.prisma.booking.findMany({
      where: {
        tripId: id,
        status: { in: ['PAID', 'PENDING'] },
      },
      select: {
        status: true,
        totalPrice: true,
        metadata: true,
        _count: {
          select: { tickets: true }
        }
      },
    });

    let actualRevenue = 0;
    let pendingRevenue = 0;
    let ticketsSold = 0;
    let ticketsPending = 0;

    for (const booking of bookings) {
      if (booking.status === 'PAID') {
        actualRevenue += booking.totalPrice;
        // Count tickets if they exist, otherwise fallback to metadata if tickets aren't created yet
        ticketsSold += (booking._count.tickets > 0) 
          ? booking._count.tickets 
          : this.countSeatsInMetadata(booking.metadata);
      } else if (booking.status === 'PENDING') {
        pendingRevenue += booking.totalPrice;
        ticketsPending += this.countSeatsInMetadata(booking.metadata);
      }
    }

    const expectedRevenue = actualRevenue + pendingRevenue;
    const occupancy = totalSeats > 0 ? Math.round((ticketsSold / totalSeats) * 100) : 0;
    const totalOccupancy = totalSeats > 0 ? Math.round(((ticketsSold + ticketsPending) / totalSeats) * 100) : 0;

    return {
      revenue: actualRevenue, // Keep for backward compatibility if needed, but UI should migrate
      actualRevenue,
      expectedRevenue,
      ticketsSold,
      ticketsPending,
      occupancy, // Paid occupancy
      totalOccupancy, // Reserved (Paid + Pending) occupancy
      totalSeats,
    };
  }

  private countSeatsInMetadata(metadata: any): number {
    if (!metadata) return 0;
    if (metadata.seatIds && Array.isArray(metadata.seatIds)) {
      return metadata.seatIds.length;
    }
    if (metadata.passengers && Array.isArray(metadata.passengers)) {
      return metadata.passengers.length;
    }
    if (metadata.seatSelections && Array.isArray(metadata.seatSelections)) {
        return metadata.seatSelections.length;
    }
    return 0;
  }

  async getLiveLocation(tripId: string, speedup?: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: {
          include: {
            stations: {
              include: {
                station: true,
              },
              orderBy: {
                index: 'asc',
              },
            },
          },
        },
        train: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip #${tripId} không tồn tại`);
    }

    const snapshot = calculateLiveLocationSnapshot(trip, speedup);
    if (snapshot.shouldMarkCompleted) {
      await this.prisma.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.COMPLETED,
          departureDelayMinutes: 0,
          arrivalDelayMinutes: 0,
        },
      });
    }

    const { shouldMarkCompleted, ...response } = snapshot;
    return {
      ...response,
    };
  }

  async getDrivers() {
    return this.prisma.user.findMany({
      where: { role: 'DRIVER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
