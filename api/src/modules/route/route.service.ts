import { Injectable, ConflictException } from '@nestjs/common';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateRouteStationDto } from './dto/update-route-station.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterRouteDto } from './dto/filter-route.dto';
import { Prisma, RouteStatus } from '../../generated/client';

@Injectable()
export class RouteService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createRouteDto: CreateRouteDto) {
    return this.prisma.route.create({
      data: {
        ...createRouteDto,
        status: (createRouteDto.status as RouteStatus) || RouteStatus.DRAFT,
      },
    });
  }

  async findAll(query: FilterRouteDto) {
    const { page = 1, limit = 10, skip, take, search, status } = query;

    const where: Prisma.RouteWhereInput = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
      ...(status && { status: status as RouteStatus }),
    };

    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take,
        orderBy: {
          [query.sort || 'createdAt']: query.order || 'desc'
        },
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
      }),
      this.prisma.route.count({ where }),
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
    return this.prisma.route.findUnique({
      where: { id },
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
    });
  }


  async update(id: string, updateRouteDto: UpdateRouteDto) {
    const { status, ...rest } = updateRouteDto;
    return this.prisma.route.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status: status as RouteStatus }),
      },
    });
  }

  async addStation(routeId: string, dto: { stationId: string; index: number; distanceFromStart: number }) {
    try {
      return await this.prisma.routeStation.create({
        data: {
          routeId,
          stationId: dto.stationId,
          index: dto.index,
          distanceFromStart: dto.distanceFromStart,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Thứ tự trạm đã tồn tại trong tuyến đường này');
      }
      throw error;
    }
  }

  async removeStation(routeId: string, stationId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get the index of the station being removed
      const stationToRemove = await tx.routeStation.findFirst({
        where: { routeId, stationId }
      });

      if (!stationToRemove) {
        throw new Error('Station not found in this route');
      }

      const removedIndex = stationToRemove.index;

      // 2. Delete the station
      await tx.routeStation.deleteMany({
        where: { routeId, stationId }
      });

      // 3. Reindex all stations with index > removedIndex
      // Decrement their index by 1 to fill the gap
      await tx.routeStation.updateMany({
        where: {
          routeId,
          index: { gt: removedIndex }
        },
        data: {
          index: { decrement: 1 }
        }
      });

      return { success: true, removedIndex, reindexedCount: await tx.routeStation.count({ where: { routeId } }) };
    });
  }

  async reorderStations(routeId: string, dto: { stations: { stationId: string; distanceFromStart: number }[] }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all existing stations for this route
      await tx.routeStation.deleteMany({
        where: { routeId }
      });

      // 2. Create new stations with derived indices
      // We use Promise.all to create them. 
      // Note: If distinct stationIds are required, the DTO validation or logic should handle it.
      // Assuming dto.stations is unique by stationId.

      const creates = dto.stations.map((item, index) =>
        tx.routeStation.create({
          data: {
            routeId,
            stationId: item.stationId,
            index: index, // derived from array order
            distanceFromStart: item.distanceFromStart,
          }
        })
      );

      return Promise.all(creates);
    });
  }

  async getAvailableStations(routeId: string, query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Get station IDs already in this route
    const routeStations = await this.prisma.routeStation.findMany({
      where: { routeId },
      select: { stationId: true }
    });

    const usedStationIds = routeStations.map(rs => rs.stationId);

    // Build where clause
    const where: Prisma.StationWhereInput = {
      id: { notIn: usedStationIds },
      ...(search && {
        name: { contains: search, mode: 'insensitive' }
      })
    };

    // Get available stations with pagination
    const [data, total] = await Promise.all([
      this.prisma.station.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      this.prisma.station.count({ where })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async updateStation(routeId: string, stationId: string, dto: UpdateRouteStationDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update RouteStation (distanceFromStart)
      await tx.routeStation.updateMany({
        where: {
          routeId,
          stationId
        },
        data: {
          distanceFromStart: dto.distanceFromStart
        }
      });

      // 2. Update Station (name, lat, long)
      await tx.station.update({
        where: { id: stationId },
        data: {
          name: dto.name,
          latitute: dto.latitute,
          longtitute: dto.longtitute
        }
      });

      return { success: true };
    });
  }

  async remove(id: string) {
    return this.prisma.route.delete({
      where: { id },
    });
  }
}
