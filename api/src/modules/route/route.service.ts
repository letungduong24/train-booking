import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateRouteStationDto } from './dto/update-route-station.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterRouteDto } from './dto/filter-route.dto';
import { Prisma, RouteStatus } from '../../generated/client';
import * as turf from '@turf/turf';

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);
  constructor(private readonly prisma: PrismaService) { }

  async create(createRouteDto: CreateRouteDto) {
    const { stations, status, ...rest } = createRouteDto;

    let createdRouteId: string;

    await this.prisma.$transaction(async (tx) => {
      const route = await tx.route.create({
        data: {
          ...rest,
          status: (status as RouteStatus) || RouteStatus.DRAFT,
        },
      });
      createdRouteId = route.id;

      if (stations && stations.length > 0) {
        const creates = stations.map((st, index) =>
          tx.routeStation.create({
            data: {
              routeId: route.id,
              stationId: st.id,
              index,
              distanceFromStart: 0,
            },
          }),
        );
        await Promise.all(creates);
      }
    });

    // calculatePathCoordinates runs OUTSIDE the transaction to avoid P2028 timeout
    if (stations && stations.length >= 2) {
      await this.calculatePathCoordinates(createdRouteId!);
    }
    return this.findOne(createdRouteId!);
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

  async findOne(id: string) {
    return this.prisma.route.findUnique({
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
    const { status, stations, ...rest } = updateRouteDto;
    return this.prisma.route.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status: status.toUpperCase() as RouteStatus }),
      },
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
    return this.prisma.$transaction(async (tx) => {
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
      // Decrement their index by 1 to fill the gap
      await tx.routeStation.updateMany({
        where: {
          routeId,
          index: { gt: removedIndex },
        },
        data: {
          index: { decrement: 1 },
        },
      });

      const reindexedCount = await tx.routeStation.count({ where: { routeId } });

      return {
        success: true,
        removedIndex,
        reindexedCount,
      };
    });

    // calculatePathCoordinates runs OUTSIDE the transaction
    await this.calculatePathCoordinates(routeId);
    return { success: true };
  }

  async reorderStations(
    routeId: string,
    dto: { stations: { stationId: string; distanceFromStart: number }[] },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all existing stations for this route
      await tx.routeStation.deleteMany({
        where: { routeId },
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
          },
        }),
      );

      const result = await Promise.all(creates);
      return result;
    });

    // calculatePathCoordinates runs OUTSIDE the transaction
    await this.calculatePathCoordinates(routeId);
    return [];
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

    // Build where clause
    const where: Prisma.StationWhereInput = {
      id: { notIn: usedStationIds },
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

  /** Greedily stitch railway segments into one continuous polyline.
   *  Starting segment = closest to `anchorPt` (first station of the route).
   *  Each step picks the unused segment whose nearest endpoint is closest to the current chain end.
   */
  private stitchSegments(allSegments: number[][][], anchorPt: number[]): number[][] {
    if (allSegments.length === 0) return [];
    if (allSegments.length === 1) return allSegments[0];

    const dist2D = (a: number[], b: number[]) =>
      Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));

    // Find the segment closest to anchorPt to start from
    let startIdx = 0;
    let minD = Infinity;
    let startFlipped = false;
    for (let i = 0; i < allSegments.length; i++) {
      const seg = allSegments[i];
      const dStart = dist2D(anchorPt, seg[0]);
      const dEnd = dist2D(anchorPt, seg[seg.length - 1]);
      if (dStart < minD) { minD = dStart; startIdx = i; startFlipped = false; }
      if (dEnd < minD) { minD = dEnd; startIdx = i; startFlipped = true; }
    }

    const remaining = allSegments.map((s, i) => ({ seg: s, idx: i }));
    const first = remaining.splice(startIdx, 1)[0];
    const stitched: number[][] = startFlipped ? [...first.seg].reverse() : [...first.seg];

    while (remaining.length > 0) {
      const tail = stitched[stitched.length - 1];
      let bestI = 0;
      let bestDist = Infinity;
      let bestFlip = false;
      for (let i = 0; i < remaining.length; i++) {
        const seg = remaining[i].seg;
        const ds = dist2D(tail, seg[0]);
        const de = dist2D(tail, seg[seg.length - 1]);
        if (ds < bestDist) { bestDist = ds; bestI = i; bestFlip = false; }
        if (de < bestDist) { bestDist = de; bestI = i; bestFlip = true; }
      }
      const next = remaining.splice(bestI, 1)[0].seg;
      const toAdd = bestFlip ? [...next].reverse() : next;
      stitched.push(...toAdd.slice(1)); // skip first point to avoid duplicates
    }

    return stitched;
  }

  private async calculatePathCoordinates(routeId: string, tx: any = this.prisma) {
    const routeStations = await tx.routeStation.findMany({
      where: { routeId },
      orderBy: { index: 'asc' },
      include: { station: true },
    });

    if (routeStations.length < 2) {
      await tx.route.update({ where: { id: routeId }, data: { pathCoordinates: [] } });
      return;
    }

    // --- Load all railway lines ---
    const networkLines = await tx.railwayLine.findMany();

    // Build individual sub-segments (used by both Strategy 1 and Strategy 2 BFS)
    const subSegments: { coords: number[][]; lineId: string }[] = [];
    for (const line of networkLines) {
      const segs = line.pathCoordinates as number[][][];
      if (!Array.isArray(segs)) continue;
      for (const seg of segs) {
        if (Array.isArray(seg) && seg.length >= 2) {
          subSegments.push({ coords: seg, lineId: line.id });
        }
      }
    }

    // ── Pre-compute BFS node info & adjacency list (done ONCE, not per pair) ──
    const CONNECT_DEG = 0.01; // ~1km endpoint-matching tolerance
    const ptDeg = (a: number[], b: number[]) =>
      Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);

    const segNodes = subSegments.map(({ coords }, idx) => ({
      idx,
      coords,
      head: coords[0],
      tail: coords[coords.length - 1],
    }));

    // Build tailAdj[a] = neighbors reachable from a's TAIL (natural orientation)
    // Build headAdj[a] = neighbors reachable from a's HEAD (reversed orientation)
    type AdjEntry = { neighborIdx: number; neighborFlipped: boolean };
    const tailAdj: AdjEntry[][] = segNodes.map(() => []);
    const headAdj: AdjEntry[][] = segNodes.map(() => []);
    for (let a = 0; a < segNodes.length; a++) {
      for (let b = 0; b < segNodes.length; b++) {
        if (a === b) continue;
        const bHead = segNodes[b].head;
        const bTail = segNodes[b].tail;
        // From a's tail
        if (ptDeg(segNodes[a].tail, bHead) < CONNECT_DEG)
          tailAdj[a].push({ neighborIdx: b, neighborFlipped: false });
        else if (ptDeg(segNodes[a].tail, bTail) < CONNECT_DEG)
          tailAdj[a].push({ neighborIdx: b, neighborFlipped: true });
        // From a's head (when a is used reversed)
        if (ptDeg(segNodes[a].head, bHead) < CONNECT_DEG)
          headAdj[a].push({ neighborIdx: b, neighborFlipped: false });
        else if (ptDeg(segNodes[a].head, bTail) < CONNECT_DEG)
          headAdj[a].push({ neighborIdx: b, neighborFlipped: true });
      }
    }

    const pathCoordinates: number[][][] = [];
    let totalDistanceKm = 0;
    const segmentDistancesKm: number[] = [];

    for (let i = 0; i < routeStations.length - 1; i++) {
      const p1 = routeStations[i].station;
      const p2 = routeStations[i + 1].station;
      const startPt = turf.point([p1.longitude, p1.latitude]);
      const endPt = turf.point([p2.longitude, p2.latitude]);
      const directDistKm = turf.distance(startPt, endPt, { units: 'kilometers' });

      const SNAP_THRESHOLD_KM = 5;
      let found = false;

      const trySnapAndSlice = (
        coords: number[][],
      ): { slicedCoords: number[][]; segKm: number } | null => {
        if (coords.length < 2) return null;
        try {
          const line = turf.lineString(coords);
          const sStart = turf.nearestPointOnLine(line, startPt);
          const sEnd = turf.nearestPointOnLine(line, endPt);
          const dStart = sStart.properties.dist ?? Infinity;
          const dEnd = sEnd.properties.dist ?? Infinity;
          if (dStart > SNAP_THRESHOLD_KM || dEnd > SNAP_THRESHOLD_KM) return null;

          const locStart = sStart.properties.location ?? 0;
          const locEnd = sEnd.properties.location ?? 0;
          const sliceLen = Math.abs(locEnd - locStart);

          // Sanity: sliced path must not be longer than 3× direct distance
          if (sliceLen > directDistKm * 3 + 10) return null;

          // Reverse coords if stations are in opposite order on the line
          const effectiveCoords = locStart > locEnd ? [...coords].reverse() : coords;
          const effectiveLine = locStart > locEnd ? turf.lineString(effectiveCoords) : line;
          const effStart = locStart > locEnd
            ? turf.nearestPointOnLine(effectiveLine, startPt)
            : sStart;
          const effEnd = locStart > locEnd
            ? turf.nearestPointOnLine(effectiveLine, endPt)
            : sEnd;

          const sliced = turf.lineSlice(
            turf.point(effStart.geometry.coordinates),
            turf.point(effEnd.geometry.coordinates),
            effectiveLine,
          );
          const slicedCoords = sliced.geometry.coordinates as number[][];
          if (slicedCoords.length < 2) return null;
          return { slicedCoords, segKm: turf.length(sliced, { units: 'kilometers' }) };
        } catch {
          return null;
        }
      };

      // ── Strategy 1: snap onto individual sub-segments ──
      // Finds the single sub-segment where both stations snap within threshold.
      // Picks best (lowest total snap distance).
      let bestResult: { slicedCoords: number[][]; segKm: number } | null = null;
      let bestSnapSum = Infinity;

      for (const { coords } of subSegments) {
        try {
          const line = turf.lineString(coords);
          const sStart = turf.nearestPointOnLine(line, startPt);
          const sEnd = turf.nearestPointOnLine(line, endPt);
          const snapSum = (sStart.properties.dist ?? Infinity) + (sEnd.properties.dist ?? Infinity);
          if (snapSum < bestSnapSum) {
            const result = trySnapAndSlice(coords);
            if (result) { bestSnapSum = snapSum; bestResult = result; }
          }
        } catch { /* skip */ }
      }

      if (bestResult) {
        pathCoordinates.push(bestResult.slicedCoords);
        segmentDistancesKm.push(bestResult.segKm);
        totalDistanceKm += bestResult.segKm;
        found = true;
      }

      // ── Strategy 2: BFS topology search across connected segments ──
      // Uses pre-computed adjacency list for O(1) neighbor lookup per step.
      if (!found) {
        const MAX_HOPS = 10;

        // Find which segments each station snaps onto within threshold
        const startIdxs: number[] = [];
        const endIdxs: number[] = [];
        for (const sn of segNodes) {
          try {
            const line = turf.lineString(sn.coords);
            const dS = turf.nearestPointOnLine(line, startPt).properties.dist ?? Infinity;
            const dE = turf.nearestPointOnLine(line, endPt).properties.dist ?? Infinity;
            if (dS <= SNAP_THRESHOLD_KM) startIdxs.push(sn.idx);
            if (dE <= SNAP_THRESHOLD_KM) endIdxs.push(sn.idx);
          } catch { /* skip */ }
        }

        const endSet = new Set(endIdxs);

        interface BFSNode {
          segIdx: number;
          flipped: boolean;
          path: Array<{ segIdx: number; flipped: boolean }>;
          effTail: number[]; // actual tail after orientation is applied
        }

        const visitedKey = new Set<string>(); // `${segIdx}-${flipped}`
        const queue: BFSNode[] = [];

        for (const idx of startIdxs) {
          const sn = segNodes[idx];
          for (const flipped of [false, true]) {
            const key = `${idx}-${flipped}`;
            if (visitedKey.has(key)) continue;
            visitedKey.add(key);
            queue.push({
              segIdx: idx,
              flipped,
              path: [{ segIdx: idx, flipped }],
              effTail: flipped ? sn.head : sn.tail,
            });
          }
        }

        let bfsPath: Array<{ segIdx: number; flipped: boolean }> | null = null;

        bfsLoop: while (queue.length > 0) {
          const node = queue.shift()!;
          if (endSet.has(node.segIdx)) { bfsPath = node.path; break bfsLoop; }
          if (node.path.length >= MAX_HOPS) continue;

          // O(degree) expansion using pre-computed adjacency
          const neighbors = node.flipped
            ? headAdj[node.segIdx]
            : tailAdj[node.segIdx];

          for (const { neighborIdx, neighborFlipped } of neighbors) {
            if (node.path.some(p => p.segIdx === neighborIdx)) continue; // avoid cycle
            const key = `${neighborIdx}-${neighborFlipped}`;
            if (visitedKey.has(key)) continue;
            visitedKey.add(key);
            const nbSn = segNodes[neighborIdx];
            queue.push({
              segIdx: neighborIdx,
              flipped: neighborFlipped,
              path: [...node.path, { segIdx: neighborIdx, flipped: neighborFlipped }],
              effTail: neighborFlipped ? nbSn.head : nbSn.tail,
            });
          }
        }

        if (bfsPath) {
          // Stitch BFS path into one polyline
          const stitched: number[][] = [];
          for (const { segIdx, flipped } of bfsPath) {
            const c = flipped ? [...segNodes[segIdx].coords].reverse() : segNodes[segIdx].coords;
            stitched.length === 0 ? stitched.push(...c) : stitched.push(...c.slice(1));
          }
          // Snap and slice (relax sanity check — stitched line is naturally longer)
          const stitchedLine = turf.lineString(stitched);
          const sS = turf.nearestPointOnLine(stitchedLine, startPt);
          const sE = turf.nearestPointOnLine(stitchedLine, endPt);
          if ((sS.properties.dist ?? Infinity) <= SNAP_THRESHOLD_KM &&
              (sE.properties.dist ?? Infinity) <= SNAP_THRESHOLD_KM) {
            const locS = sS.properties.location ?? 0;
            const locE = sE.properties.location ?? 0;
            const effLine = locS > locE ? turf.lineString([...stitched].reverse()) : stitchedLine;
            const effS = locS > locE ? turf.nearestPointOnLine(effLine, startPt) : sS;
            const effE = locS > locE ? turf.nearestPointOnLine(effLine, endPt) : sE;
            const sliced = turf.lineSlice(
              turf.point(effS.geometry.coordinates),
              turf.point(effE.geometry.coordinates),
              effLine,
            );
            const slicedCoords = sliced.geometry.coordinates as number[][];
            if (slicedCoords.length >= 2) {
              const segKm = turf.length(sliced, { units: 'kilometers' });
              pathCoordinates.push(slicedCoords);
              segmentDistancesKm.push(segKm);
              totalDistanceKm += segKm;
              found = true;
            }
          }
        }
      }

      // ── Không tìm thấy đường sắt nào → ném exception ──
      if (!found) {
        throw new BadRequestException(
          `Không tìm thấy đường sắt kết nối giữa "${p1.name}" và "${p2.name}". ` +
          `Vui lòng chọn các ga nằm trên cùng tuyến đường sắt.`,
        );
      }
    }

    await tx.route.update({
      where: { id: routeId },
      data: {
        pathCoordinates,
        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      },
    });

    // ── Cập nhật distanceFromStart cho từng RouteStation theo quãng đường thực tế trên network ──
    let cumulative = 0;
    for (let i = 0; i < routeStations.length; i++) {
      await tx.routeStation.updateMany({
        where: { routeId, stationId: routeStations[i].stationId },
        data: { distanceFromStart: Math.round(cumulative * 10) / 10 },
      });
      if (i < segmentDistancesKm.length) {
        cumulative += segmentDistancesKm[i];
      }
    }
  }
}
