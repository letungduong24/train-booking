import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateRouteStationDto } from './dto/update-route-station.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterRouteDto } from './dto/filter-route.dto';
import { Prisma, RouteStatus } from '../../generated/client';
import * as turf from '@turf/turf';
import { calculateRoutePath } from './utils/route-path-calculator';

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);
  constructor(private readonly prisma: PrismaService) { }

  async create(createRouteDto: CreateRouteDto) {
    const { stations, status, networkId, ...rest } = createRouteDto;

    let createdRouteId: string;

    return this.prisma.$transaction(async (tx) => {
      let activeNetworkId = networkId;
      if (!activeNetworkId) {
        const latest = await tx.network.findFirst({ orderBy: { version: 'desc' } });
        if (!latest) throw new BadRequestException('No network available');
        activeNetworkId = latest.id;
      }

      const route = await tx.route.create({
        data: {
          ...rest,
          networkId: activeNetworkId,
          status: (status?.toUpperCase() as any) || RouteStatus.DRAFT,
        },
      });
      createdRouteId = route.id;

      if (stations && stations.length > 0) {
        const stationIds = stations.map(s => s.id);
        const dbStations = await tx.station.findMany({
          where: { id: { in: stationIds } }
        });
        const stationMap = new Map(dbStations.map(s => [s.id, s]));

        let cumulativeDistance = 0;
        for (let i = 0; i < stations.length; i++) {
          const st = stationMap.get(stations[i].id);
          if (!st) throw new BadRequestException(`Station ${stations[i].id} not found`);

          if (i > 0) {
            const prev = stationMap.get(stations[i - 1].id)!;
            const a = turf.point([prev.longitude, prev.latitude]);
            const b = turf.point([st.longitude, st.latitude]);
            cumulativeDistance += turf.distance(a, b, { units: 'kilometers' });
          }

          await tx.routeStation.create({
            data: {
              routeId: route.id,
              stationId: st.id,
              index: i,
              distanceFromStart: +cumulativeDistance.toFixed(2),
            },
          });
        }
      }

      // Calculate path coordinates INSIDE transaction to ensure validity
      // If this throws, the entire route creation rolls back.
      if (stations && stations.length >= 2) {
        await this.calculatePathCoordinates(createdRouteId, tx);
      }

      return this.findOne(createdRouteId, tx);
    }, {
      timeout: 30000 // Increase timeout to 30s for heavy BFS calculations
    });
  }

  async findAll(query: FilterRouteDto) {
    const { page = 1, limit = 10, skip, take, search, status } = query;

    const where: Prisma.RouteWhereInput = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
      ...(status && { status: status.toUpperCase() as RouteStatus }),
    };

    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take,
        orderBy: {
          [query.sort || 'createdAt']: query.order || 'desc',
        },
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

  async findOne(id: string, tx: any = this.prisma) {
    return tx.route.findUnique({
      where: { id },
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
    });
  }

  async update(id: string, updateRouteDto: UpdateRouteDto) {
    const { status, stations, networkId, ...rest } = updateRouteDto;
    
    return this.prisma.$transaction(async (tx) => {
      const currentRoute = await tx.route.findUnique({
        where: { id },
        include: { stations: true }
      });

      if (!currentRoute) {
        throw new BadRequestException('Route not found');
      }

      const newStatus = status ? status.toUpperCase() as RouteStatus : currentRoute.status;
      const targetNetworkId = networkId || currentRoute.networkId;

      // Validate NEW stations belong to targetNetworkId
      if (stations && stations.length > 0) {
        const stationIds = stations.map(s => s.id);
        const uniqueStationIds = [...new Set(stationIds)];
        
        // Find which stations are newly added (not in current route)
        const existingStationIds = new Set(currentRoute.stations.map(st => st.stationId));
        const newStationIds = uniqueStationIds.filter(id => !existingStationIds.has(id));

        if (newStationIds.length > 0) {
          const validStations = await tx.station.count({
            where: { id: { in: newStationIds }, networkId: targetNetworkId }
          });
          if (validStations !== newStationIds.length) {
            throw new BadRequestException(`Some stations do not belong to the requested network. Valid: ${validStations}, Expected: ${newStationIds.length}`);
          }
        }
      }

      // Ensure we cannot revert from ACTIVE/INACTIVE back to DRAFT
      if (currentRoute.status !== RouteStatus.DRAFT && newStatus === RouteStatus.DRAFT) {
        throw new BadRequestException('Cannot revert an ACTIVE or INACTIVE route back to DRAFT.');
      }

      // Find the latest version for this route code to ensure monotonic progression
      const latestRoute = await tx.route.findFirst({
        where: { code: currentRoute.code },
        orderBy: { version: 'desc' }
      });
      const maxVersion = latestRoute ? latestRoute.version : currentRoute.version;

      // We must clone to a new version progression if:
      // 1. The route is currently ACTIVE (any update preserves its published history)
      // 2. OR an old INACTIVE route is being activated (newStatus === ACTIVE), ensuring pure monotonic progression.
      // Exception: purely deactivating an ACTIVE route (newStatus === INACTIVE) does not clone.
      const requiresClone = (currentRoute.status === RouteStatus.ACTIVE && newStatus !== RouteStatus.INACTIVE) ||
                            (currentRoute.status === RouteStatus.INACTIVE && newStatus === RouteStatus.ACTIVE);

      let targetRouteId = id;

      if (requiresClone) {
        // Clone to maxVersion + 1
        const clonedRoute = await tx.route.create({
          data: {
            ...rest,
            code: currentRoute.code,
            version: maxVersion + 1,
            networkId: targetNetworkId,
            name: rest.name || currentRoute.name,
            durationMinutes: rest.durationMinutes ?? currentRoute.durationMinutes,
            turnaroundMinutes: rest.turnaroundMinutes ?? currentRoute.turnaroundMinutes,
            basePricePerKm: rest.basePricePerKm ?? currentRoute.basePricePerKm,
            stationFee: rest.stationFee ?? currentRoute.stationFee,
            totalDistanceKm: rest.totalDistanceKm ?? currentRoute.totalDistanceKm,
            status: newStatus,
          }
        });

        // Ensure ALL other versions of this route code are transitioned to INACTIVE to guarantee unique active status
        await tx.route.updateMany({
          where: { code: currentRoute.code, id: { not: clonedRoute.id } },
          data: { status: RouteStatus.INACTIVE }
        });

        targetRouteId = clonedRoute.id;

        // If stations are not explicitly provided in DTO, copy them from the old route
        if (!stations) {
          if (targetNetworkId !== currentRoute.networkId) {
            throw new BadRequestException('Must provide new stations when changing network.');
          }
          const creates = currentRoute.stations.map((st) =>
            tx.routeStation.create({
              data: {
                routeId: targetRouteId,
                stationId: st.stationId,
                index: st.index,
                distanceFromStart: st.distanceFromStart,
              },
            }),
          );
          await Promise.all(creates);
        }
      } else {
        // Just update existing route in-place
        await tx.route.update({
          where: { id: targetRouteId },
          data: {
            ...rest,
            networkId: targetNetworkId,
            status: newStatus,
          },
        });

        // If this route is becoming ACTIVE, automatically mark all parallel versions as INACTIVE
        if (newStatus === RouteStatus.ACTIVE) {
          await tx.route.updateMany({
            where: { code: currentRoute.code, id: { not: targetRouteId } },
            data: { status: RouteStatus.INACTIVE }
          });
        }
      }

      // If stations were provided in DTO, we need to completely replace them
      if (stations) {
        // If we didn't clone, we need to clear existing stations
        if (!requiresClone) {
          await tx.routeStation.deleteMany({
            where: { routeId: targetRouteId }
          });
        }

        if (stations.length > 0) {
          const stationIds = stations.map(s => s.id);
          const dbStations = await tx.station.findMany({
            where: { id: { in: stationIds } }
          });
          const stationMap = new Map(dbStations.map(s => [s.id, s]));

          let cumulativeDistance = 0;
          for (let i = 0; i < stations.length; i++) {
            const st = stationMap.get(stations[i].id);
            if (!st) throw new BadRequestException(`Station ${stations[i].id} not found`);

            if (i > 0) {
              const prev = stationMap.get(stations[i - 1].id)!;
              const a = turf.point([prev.longitude, prev.latitude]);
              const b = turf.point([st.longitude, st.latitude]);
              cumulativeDistance += turf.distance(a, b, { units: 'kilometers' });
            }

            await tx.routeStation.create({
              data: {
                routeId: targetRouteId,
                stationId: st.id,
                index: i,
                distanceFromStart: +cumulativeDistance.toFixed(2),
              },
            });
          }
        }
      }

      // Recalculate path coordinates INSIDE transaction
      // This ensures that any "invalid" path (e.g. straight line where no track exists)
      // will trigger a rollback and prevent the update from being saved.
      if (stations && stations.length >= 2) {
        await this.calculatePathCoordinates(targetRouteId, tx);
      } else if (stations && stations.length < 2) {
        // If someone updated to < 2 stations, it's invalid anyway but DTO should catch it.
        // If it gets here, we clear the path.
        await tx.route.update({
          where: { id: targetRouteId },
          data: { pathCoordinates: [] }
        });
      }

      return targetRouteId;
    }, {
      timeout: 30000 // Increase timeout to 30s
    }).then(async (finalRouteId) => {
      // Return final route info (findOne will use this.prisma here as it's outside)
      return this.findOne(finalRouteId);
    });
  }

  async addStation(
    routeId: string,
    dto: { stationId: string; index: number; distanceFromStart: number },
  ) {
    try {
      const result = await this.prisma.routeStation.create({
        data: {
          routeId,
          stationId: dto.stationId,
          index: dto.index,
          distanceFromStart: dto.distanceFromStart,
        },
      });
      await this.calculatePathCoordinates(routeId);
      return result;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Thứ tự trạm đã tồn tại trong tuyến đường này',
        );
      }
      throw error;
    }
  }

  async removeStation(routeId: string, stationId: string) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Get the index of the station being removed
      const stationToRemove = await tx.routeStation.findFirst({
        where: { routeId, stationId },
      });

      if (!stationToRemove) {
        throw new Error('Station not found in this route');
      }

      const removedIndex = stationToRemove.index;

      // 2. Delete the station
      await tx.routeStation.deleteMany({
        where: { routeId, stationId },
      });

      // 3. Reindex all stations with index > removedIndex
      await tx.routeStation.updateMany({
        where: {
          routeId,
          index: { gt: removedIndex },
        },
        data: {
          index: { decrement: 1 },
        },
      });
    });

    // calculatePathCoordinates runs OUTSIDE the transaction
    await this.calculatePathCoordinates(routeId);
    return { success: true };
  }

  async reorderStations(
    routeId: string,
    dto: { stations: { stationId: string; distanceFromStart: number }[] },
  ) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete all existing stations for this route
      await tx.routeStation.deleteMany({
        where: { routeId },
      });

      // 2. Create new stations with derived indices
      const creates = dto.stations.map((item, index) =>
        tx.routeStation.create({
          data: {
            routeId,
            stationId: item.stationId,
            index: index, // derived from array order
            distanceFromStart: 0, // Reset to 0, will be recalculated
          },
        }),
      );

      await Promise.all(creates);
    });

    // calculatePathCoordinates runs OUTSIDE the transaction to ensure correct distance calculation
    await this.calculatePathCoordinates(routeId);
    return { success: true };
  }

  async getAvailableStations(
    routeId: string,
    query: { page?: number; limit?: number; search?: string },
  ) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Get station IDs already in this route
    const routeStations = await this.prisma.routeStation.findMany({
      where: { routeId },
      select: { stationId: true },
    });

    const usedStationIds = routeStations.map((rs) => rs.stationId);

    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      select: { networkId: true }
    });

    // Build where clause
    const where: Prisma.StationWhereInput = {
      id: { notIn: usedStationIds },
      ...(route?.networkId && { networkId: route.networkId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    // Get available stations with pagination
    const [data, total] = await Promise.all([
      this.prisma.station.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.station.count({ where }),
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

  async updateStation(
    routeId: string,
    stationId: string,
    dto: UpdateRouteStationDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update RouteStation (distanceFromStart)
      await tx.routeStation.updateMany({
        where: {
          routeId,
          stationId,
        },
        data: {
          distanceFromStart: dto.distanceFromStart,
        },
      });

      // 2. Update Station (name, lat, long)
      await tx.station.update({
        where: { id: stationId },
        data: {
          name: dto.name,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });

      return { success: true };
    });
  }

  async remove(id: string) {
    return this.prisma.route.delete({
      where: { id },
    });
  }

  async recalculatePath(id: string) {
    await this.calculatePathCoordinates(id);
    return this.findOne(id);
  }

  private async calculatePathCoordinates(routeId: string, tx: any = this.prisma) {
    const route = await tx.route.findUnique({
      where: { id: routeId },
      select: { networkId: true },
    });

    if (!route) {
      throw new BadRequestException('Không tìm thấy tuyến đường');
    }

    const routeStations = await tx.routeStation.findMany({
      where: { routeId },
      orderBy: { index: 'asc' },
      include: { station: true },
    });

    if (routeStations.length < 2) {
      await tx.route.update({
        where: { id: routeId },
        data: { pathCoordinates: [], totalDistanceKm: 0 },
      });
      return;
    }

    const networkLines = await tx.railwayLine.findMany({
      where: { networkId: route.networkId },
      select: { id: true, pathCoordinates: true },
    });

    const calculated = calculateRoutePath(routeStations, networkLines);

    await tx.route.update({
      where: { id: routeId },
      data: {
        pathCoordinates: calculated.pathCoordinates,
        totalDistanceKm: calculated.totalDistanceKm,
      },
    });

    for (let index = 0; index < routeStations.length; index++) {
      await tx.routeStation.updateMany({
        where: { routeId, stationId: routeStations[index].stationId },
        data: { distanceFromStart: calculated.stationDistancesKm[index] ?? 0 },
      });
    }
  }
}
