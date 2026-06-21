import { BadRequestException } from '@nestjs/common';
import type { Feature, LineString, Point } from 'geojson';
import * as turf from '@turf/turf';

type Coordinate = number[];
type LineCoordinates = number[][];
type TurfLine = Feature<LineString>;
type TurfPoint = Feature<Point>;

export interface RoutePathStation {
  stationId: string;
  station: {
    name: string;
    longitude: number;
    latitude: number;
  };
}

export interface RailwayPathLine {
  id: string;
  pathCoordinates: unknown;
}

export interface CalculatedRoutePath {
  pathCoordinates: LineCoordinates[];
  totalDistanceKm: number;
  stationDistancesKm: number[];
}

interface SubSegment {
  coords: LineCoordinates;
  lineId: string;
}

interface SegmentNode extends SubSegment {
  idx: number;
  head: Coordinate;
  tail: Coordinate;
  line: TurfLine;
  bbox: BoundingBox;
}

interface AdjEntry {
  neighborIdx: number;
  neighborFlipped: boolean;
}

interface SlicedSegment {
  slicedCoords: LineCoordinates;
  segKm: number;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface PointIndexEntry<T> {
  point: Coordinate;
  value: T;
}

interface PointGridIndex<T> {
  cellSize: number;
  cells: Map<string, Array<PointIndexEntry<T>>>;
}

interface SegmentGridIndex {
  cellSize: number;
  cells: Map<string, number[]>;
}

interface EndpointValue {
  segmentIdx: number;
  endpoint: 'head' | 'tail';
}

const SNAP_THRESHOLD_KM = 5;
const CONNECT_DEG = 0.01;
const MAX_BFS_HOPS = 10;
const SNAP_PREFILTER_DEG = 0.08;
const SEGMENT_GRID_DEG = 0.1;
const STATION_ON_PATH_THRESHOLD_KM = 0.35;
const BACKTRACKING_THRESHOLD_KM = 0.15;

export function calculateRoutePath(
  routeStations: RoutePathStation[],
  networkLines: RailwayPathLine[],
): CalculatedRoutePath {
  if (routeStations.length < 2) {
    return {
      pathCoordinates: [],
      totalDistanceKm: 0,
      stationDistancesKm: routeStations.map(() => 0),
    };
  }

  const subSegments = normalizeSubSegments(networkLines);
  if (subSegments.length === 0) {
    throw new BadRequestException('Mạng lưới đường sắt chưa có dữ liệu đường ray hợp lệ');
  }

  const segmentNodes = buildSegmentNodes(subSegments);
  const segmentIndex = buildSegmentGridIndex(segmentNodes);
  const adjacency = buildAdjacency(segmentNodes);

  const pathCoordinates: LineCoordinates[] = [];
  const segmentDistancesKm: number[] = [];
  let totalDistanceKm = 0;

  for (let i = 0; i < routeStations.length - 1; i++) {
    const result =
      findDirectSegment(routeStations, segmentNodes, segmentIndex, pathCoordinates, i) ??
      findConnectedSegment(
        routeStations,
        segmentNodes,
        segmentIndex,
        adjacency,
        pathCoordinates,
        i,
      );

    if (!result) {
      const from = routeStations[i].station.name;
      const to = routeStations[i + 1].station.name;
      throw new BadRequestException(`Đoạn đường từ ${from} đến ${to} không hợp lệ`);
    }

    pathCoordinates.push(result.slicedCoords);
    segmentDistancesKm.push(result.segKm);
    totalDistanceKm += result.segKm;
  }

  return {
    pathCoordinates,
    totalDistanceKm: roundKm(totalDistanceKm),
    stationDistancesKm: buildStationDistances(segmentDistancesKm),
  };
}

function normalizeSubSegments(networkLines: RailwayPathLine[]): SubSegment[] {
  const subSegments: SubSegment[] = [];

  for (const line of networkLines) {
    const segments = normalizeLineSegments(line.pathCoordinates);

    for (const coords of segments) {
      subSegments.push({ coords, lineId: line.id });
    }
  }

  return subSegments;
}

function normalizeLineSegments(pathCoordinates: unknown): LineCoordinates[] {
  if (isLineCoordinates(pathCoordinates)) {
    return [pathCoordinates];
  }

  if (!Array.isArray(pathCoordinates)) {
    return [];
  }

  return pathCoordinates.filter(isLineCoordinates);
}

function isLineCoordinates(value: unknown): value is LineCoordinates {
  return Array.isArray(value) && value.length >= 2 && value.every(isCoordinate);
}

function isCoordinate(value: unknown): value is Coordinate {
  if (!Array.isArray(value) || value.length < 2) return false;

  const [longitude, latitude] = value;
  return (
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    typeof latitude === 'number' &&
    Number.isFinite(latitude)
  );
}

function buildSegmentNodes(subSegments: SubSegment[]): SegmentNode[] {
  return subSegments.map(({ coords, lineId }, idx) => {
    const line = turf.lineString(coords);
    return {
      idx,
      lineId,
      coords,
      head: coords[0],
      tail: coords[coords.length - 1],
      line,
      bbox: getBoundingBox(coords),
    };
  });
}

function buildAdjacency(segmentNodes: SegmentNode[]) {
  const tailAdj: AdjEntry[][] = segmentNodes.map(() => []);
  const headAdj: AdjEntry[][] = segmentNodes.map(() => []);
  const endpointIndex = buildEndpointIndex(segmentNodes);

  for (const segment of segmentNodes) {
    tailAdj[segment.idx] = findEndpointNeighbors(endpointIndex, segment.tail, segment.idx);
    headAdj[segment.idx] = findEndpointNeighbors(endpointIndex, segment.head, segment.idx);
  }

  return { tailAdj, headAdj };
}

function buildEndpointIndex(segmentNodes: SegmentNode[]): PointGridIndex<EndpointValue> {
  const entries: Array<PointIndexEntry<EndpointValue>> = [];

  for (const segment of segmentNodes) {
    entries.push({
      point: segment.head,
      value: { segmentIdx: segment.idx, endpoint: 'head' },
    });
    entries.push({
      point: segment.tail,
      value: { segmentIdx: segment.idx, endpoint: 'tail' },
    });
  }

  return buildPointGridIndex(entries, CONNECT_DEG);
}

function findEndpointNeighbors(
  endpointIndex: PointGridIndex<EndpointValue>,
  point: Coordinate,
  selfIdx: number,
): AdjEntry[] {
  const seen = new Set<string>();
  const neighbors: AdjEntry[] = [];

  for (const entry of queryPointGridIndex(endpointIndex, point, CONNECT_DEG)) {
    const { segmentIdx, endpoint } = entry.value;
    if (segmentIdx === selfIdx) continue;

    const neighborFlipped = endpoint === 'tail';
    const key = `${segmentIdx}-${neighborFlipped}`;
    if (seen.has(key)) continue;

    seen.add(key);
    neighbors.push({ neighborIdx: segmentIdx, neighborFlipped });
  }

  return neighbors;
}

function buildSegmentGridIndex(segmentNodes: SegmentNode[]): SegmentGridIndex {
  const cells = new Map<string, number[]>();

  for (const segment of segmentNodes) {
    const minCellX = Math.floor(segment.bbox.minX / SEGMENT_GRID_DEG);
    const maxCellX = Math.floor(segment.bbox.maxX / SEGMENT_GRID_DEG);
    const minCellY = Math.floor(segment.bbox.minY / SEGMENT_GRID_DEG);
    const maxCellY = Math.floor(segment.bbox.maxY / SEGMENT_GRID_DEG);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const key = getGridKey(x, y);
        const bucket = cells.get(key) ?? [];
        bucket.push(segment.idx);
        cells.set(key, bucket);
      }
    }
  }

  return { cellSize: SEGMENT_GRID_DEG, cells };
}

function getSharedCandidateSegments(
  segmentIndex: SegmentGridIndex,
  segmentNodes: SegmentNode[],
  pair: ReturnType<typeof getStationPair>,
) {
  const startCandidates = getCandidateSegmentsNearPoint(segmentIndex, segmentNodes, pair.startPt);
  const endCandidates = getCandidateSegmentsNearPoint(segmentIndex, segmentNodes, pair.endPt);
  const endSet = new Set(endCandidates);
  const shared = startCandidates.filter((idx) => endSet.has(idx));

  if (shared.length > 0) return shared;
  if (startCandidates.length === 0 || endCandidates.length === 0) {
    return segmentNodes.map((segment) => segment.idx);
  }

  return [];
}

function getCandidateSegmentsNearPoint(
  segmentIndex: SegmentGridIndex,
  segmentNodes: SegmentNode[],
  point: TurfPoint,
) {
  const coordinate = point.geometry.coordinates as Coordinate;
  const result = new Set<number>();
  const minCellX = Math.floor((coordinate[0] - SNAP_PREFILTER_DEG) / segmentIndex.cellSize);
  const maxCellX = Math.floor((coordinate[0] + SNAP_PREFILTER_DEG) / segmentIndex.cellSize);
  const minCellY = Math.floor((coordinate[1] - SNAP_PREFILTER_DEG) / segmentIndex.cellSize);
  const maxCellY = Math.floor((coordinate[1] + SNAP_PREFILTER_DEG) / segmentIndex.cellSize);

  for (let x = minCellX; x <= maxCellX; x++) {
    for (let y = minCellY; y <= maxCellY; y++) {
      const bucket = segmentIndex.cells.get(getGridKey(x, y));
      if (!bucket) continue;

      for (const idx of bucket) {
        if (bboxContainsPointBuffer(segmentNodes[idx].bbox, coordinate, SNAP_PREFILTER_DEG)) {
          result.add(idx);
        }
      }
    }
  }

  return result.size > 0
    ? [...result]
    : segmentNodes.map((segment) => segment.idx);
}

function buildPointGridIndex<T>(
  entries: Array<PointIndexEntry<T>>,
  cellSize: number,
): PointGridIndex<T> {
  const cells = new Map<string, Array<PointIndexEntry<T>>>();

  for (const entry of entries) {
    const cellX = Math.floor(entry.point[0] / cellSize);
    const cellY = Math.floor(entry.point[1] / cellSize);
    const key = getGridKey(cellX, cellY);
    const bucket = cells.get(key) ?? [];
    bucket.push(entry);
    cells.set(key, bucket);
  }

  return { cellSize, cells };
}

function queryPointGridIndex<T>(
  index: PointGridIndex<T>,
  point: Coordinate,
  radius: number,
): Array<PointIndexEntry<T>> {
  const results: Array<PointIndexEntry<T>> = [];
  const centerX = Math.floor(point[0] / index.cellSize);
  const centerY = Math.floor(point[1] / index.cellSize);
  const cellRadius = Math.ceil(radius / index.cellSize);

  for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
    for (let y = centerY - cellRadius; y <= centerY + cellRadius; y++) {
      const bucket = index.cells.get(getGridKey(x, y));
      if (!bucket) continue;

      for (const entry of bucket) {
        if (pointDistanceDegrees(point, entry.point) < radius) {
          results.push(entry);
        }
      }
    }
  }

  return results;
}

function findDirectSegment(
  routeStations: RoutePathStation[],
  segmentNodes: SegmentNode[],
  segmentIndex: SegmentGridIndex,
  existingPath: LineCoordinates[],
  stationIndex: number,
): SlicedSegment | null {
  const pair = getStationPair(routeStations, stationIndex);
  const candidateIndexes = getSharedCandidateSegments(segmentIndex, segmentNodes, pair);
  let bestResult: SlicedSegment | null = null;
  let bestSnapSum = Infinity;

  for (const idx of candidateIndexes) {
    const segment = segmentNodes[idx];
    try {
      const startSnap = turf.nearestPointOnLine(segment.line, pair.startPt);
      const endSnap = turf.nearestPointOnLine(segment.line, pair.endPt);
      const snapSum =
        (startSnap.properties.dist ?? Infinity) + (endSnap.properties.dist ?? Infinity);

      if (snapSum >= bestSnapSum) continue;

      const result = trySnapAndSlice(segment.coords, pair, {
        line: segment.line,
        startSnap,
        endSnap,
      });
      if (
        result &&
        !hasIntermediateOverlap(result.slicedCoords, routeStations, stationIndex) &&
        !hasBacktracking(result.slicedCoords, existingPath)
      ) {
        bestSnapSum = snapSum;
        bestResult = result;
      }
    } catch {
      // Ignore malformed geometry and keep evaluating the rest of the network.
    }
  }

  return bestResult;
}

function findConnectedSegment(
  routeStations: RoutePathStation[],
  segmentNodes: SegmentNode[],
  segmentIndex: SegmentGridIndex,
  adjacency: { tailAdj: AdjEntry[][]; headAdj: AdjEntry[][] },
  existingPath: LineCoordinates[],
  stationIndex: number,
): SlicedSegment | null {
  const pair = getStationPair(routeStations, stationIndex);
  const startIdxs: number[] = [];
  const endIdxs: number[] = [];
  const startCandidates = getCandidateSegmentsNearPoint(segmentIndex, segmentNodes, pair.startPt);
  const endCandidates = getCandidateSegmentsNearPoint(segmentIndex, segmentNodes, pair.endPt);

  for (const idx of startCandidates) {
    const segment = segmentNodes[idx];
    try {
      const dStart = turf.nearestPointOnLine(segment.line, pair.startPt).properties.dist ?? Infinity;
      if (dStart <= SNAP_THRESHOLD_KM) startIdxs.push(segment.idx);
    } catch {
      // Ignore malformed geometry.
    }
  }

  for (const idx of endCandidates) {
    const segment = segmentNodes[idx];
    try {
      const dEnd = turf.nearestPointOnLine(segment.line, pair.endPt).properties.dist ?? Infinity;
      if (dEnd <= SNAP_THRESHOLD_KM) endIdxs.push(segment.idx);
    } catch {
      // Ignore malformed geometry.
    }
  }

  const bfsPath = findBfsPath(segmentNodes, adjacency, startIdxs, new Set(endIdxs));
  if (!bfsPath) return null;

  const stitched = stitchBfsPath(segmentNodes, bfsPath);
  const result = trySnapAndSlice(stitched, pair, { relaxLengthCheck: true });
  if (!result) return null;

  if (
    hasIntermediateOverlap(result.slicedCoords, routeStations, stationIndex) ||
    hasBacktracking(result.slicedCoords, existingPath)
  ) {
    return null;
  }

  return result;
}

function findBfsPath(
  segmentNodes: SegmentNode[],
  adjacency: { tailAdj: AdjEntry[][]; headAdj: AdjEntry[][] },
  startIdxs: number[],
  endSet: Set<number>,
) {
  interface BfsNode {
    segIdx: number;
    flipped: boolean;
    path: Array<{ segIdx: number; flipped: boolean }>;
  }

  const visited = new Set<string>();
  const queue: BfsNode[] = [];
  let cursor = 0;

  for (const idx of startIdxs) {
    for (const flipped of [false, true]) {
      const key = `${idx}-${flipped}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ segIdx: idx, flipped, path: [{ segIdx: idx, flipped }] });
    }
  }

  while (cursor < queue.length) {
    const node = queue[cursor++];
    if (endSet.has(node.segIdx)) return node.path;
    if (node.path.length >= MAX_BFS_HOPS) continue;

    const neighbors = node.flipped
      ? adjacency.headAdj[node.segIdx]
      : adjacency.tailAdj[node.segIdx];

    for (const { neighborIdx, neighborFlipped } of neighbors) {
      if (node.path.some((p) => p.segIdx === neighborIdx)) continue;

      const key = `${neighborIdx}-${neighborFlipped}`;
      if (visited.has(key)) continue;

      visited.add(key);
      queue.push({
        segIdx: neighborIdx,
        flipped: neighborFlipped,
        path: [...node.path, { segIdx: neighborIdx, flipped: neighborFlipped }],
      });
    }
  }

  return null;
}

function stitchBfsPath(
  segmentNodes: SegmentNode[],
  bfsPath: Array<{ segIdx: number; flipped: boolean }>,
): LineCoordinates {
  const stitched: LineCoordinates = [];

  for (const { segIdx, flipped } of bfsPath) {
    const coords = flipped
      ? [...segmentNodes[segIdx].coords].reverse()
      : segmentNodes[segIdx].coords;
    stitched.length === 0 ? stitched.push(...coords) : stitched.push(...coords.slice(1));
  }

  return stitched;
}

function trySnapAndSlice(
  coords: LineCoordinates,
  pair: ReturnType<typeof getStationPair>,
  options: {
    relaxLengthCheck?: boolean;
    line?: TurfLine;
    startSnap?: TurfPoint;
    endSnap?: TurfPoint;
  } = {},
): SlicedSegment | null {
  if (coords.length < 2) return null;

  try {
    const line = options.line ?? turf.lineString(coords);
    const startSnap = options.startSnap ?? turf.nearestPointOnLine(line, pair.startPt);
    const endSnap = options.endSnap ?? turf.nearestPointOnLine(line, pair.endPt);
    const dStart = startSnap.properties?.dist ?? Infinity;
    const dEnd = endSnap.properties?.dist ?? Infinity;

    if (dStart > SNAP_THRESHOLD_KM || dEnd > SNAP_THRESHOLD_KM) return null;

    const locStart = startSnap.properties?.location ?? 0;
    const locEnd = endSnap.properties?.location ?? 0;
    const sliceLen = Math.abs(locEnd - locStart);

    if (!options.relaxLengthCheck && sliceLen > pair.directDistKm * 3 + 10) {
      return null;
    }

    const reversed = locStart > locEnd;
    const effectiveCoords = reversed ? [...coords].reverse() : coords;
    const effectiveLine = reversed ? turf.lineString(effectiveCoords) : line;
    const effectiveStart = reversed
      ? turf.nearestPointOnLine(effectiveLine, pair.startPt)
      : startSnap;
    const effectiveEnd = reversed
      ? turf.nearestPointOnLine(effectiveLine, pair.endPt)
      : endSnap;

    const sliced = turf.lineSlice(
      turf.point(effectiveStart.geometry.coordinates),
      turf.point(effectiveEnd.geometry.coordinates),
      effectiveLine,
    );
    const slicedCoords = sliced.geometry.coordinates as LineCoordinates;

    if (slicedCoords.length < 2) return null;
    return { slicedCoords, segKm: turf.length(sliced, { units: 'kilometers' }) };
  } catch {
    return null;
  }
}

function hasBacktracking(newCoords: LineCoordinates, existingPath: LineCoordinates[]) {
  if (existingPath.length === 0 || newCoords.length < 2) return false;

  const newLine = turf.lineString(newCoords);
  const newLen = turf.length(newLine, { units: 'kilometers' });
  if (newLen <= 0) return false;

  const sampleStepKm = Math.max(0.25, Math.min(1, newLen / 20));
  const connectionToleranceKm = Math.min(2, Math.max(0.5, newLen * 0.15));
  const maxAllowedOverlapKm = Math.min(3, Math.max(0.75, newLen * 0.25));

  for (let i = 0; i < existingPath.length; i++) {
    const prevCoords = existingPath[i];
    if (prevCoords.length < 2) continue;

    const prevLine = turf.lineString(prevCoords);
    let overlapKm = 0;

    for (let distKm = sampleStepKm; distKm < newLen; distKm += sampleStepKm) {
      if (i === existingPath.length - 1 && distKm <= connectionToleranceKm) {
        continue;
      }

      const pt = turf.along(newLine, distKm, { units: 'kilometers' });
      try {
        const snapped = turf.nearestPointOnLine(prevLine, pt);
        const dist = snapped.properties.dist ?? Infinity;
        if (dist <= BACKTRACKING_THRESHOLD_KM) {
          overlapKm += sampleStepKm;
          if (overlapKm > maxAllowedOverlapKm) return true;
        } else {
          overlapKm = 0;
        }
      } catch {
        // Ignore malformed points.
      }
    }
  }

  return false;
}

function hasIntermediateOverlap(
  coords: LineCoordinates,
  routeStations: RoutePathStation[],
  currentIdx: number,
) {
  if (coords.length < 2) return false;

  const line = turf.lineString(coords);
  const lineLen = turf.length(line, { units: 'kilometers' });
  if (lineLen <= 0) return false;

  for (let j = 0; j < routeStations.length; j++) {
    if (j === currentIdx || j === currentIdx + 1) continue;

    const station = routeStations[j].station;
    const pt = turf.point([station.longitude, station.latitude]);
    try {
      const snapped = turf.nearestPointOnLine(line, pt);
      const snapDist = snapped.properties.dist ?? Infinity;
      const location = snapped.properties.location ?? 0;

      const isInsideSegment =
        location > STATION_ON_PATH_THRESHOLD_KM &&
        location < lineLen - STATION_ON_PATH_THRESHOLD_KM;

      if (snapDist <= STATION_ON_PATH_THRESHOLD_KM && isInsideSegment) {
        const linePoint = turf.point(snapped.geometry.coordinates);
        const stationDistance = turf.distance(pt, linePoint, { units: 'kilometers' });
        if (stationDistance <= STATION_ON_PATH_THRESHOLD_KM) {
          return true;
        }
      }
    } catch {
      // Ignore malformed geometry.
    }
  }

  return false;
}

function getStationPair(routeStations: RoutePathStation[], stationIndex: number) {
  const start = routeStations[stationIndex].station;
  const end = routeStations[stationIndex + 1].station;
  const startPt = turf.point([start.longitude, start.latitude]);
  const endPt = turf.point([end.longitude, end.latitude]);

  return {
    start,
    end,
    startPt,
    endPt,
    directDistKm: turf.distance(startPt, endPt, { units: 'kilometers' }),
  };
}

function buildStationDistances(segmentDistancesKm: number[]) {
  const stationDistances = [0];
  let cumulative = 0;

  for (const distance of segmentDistancesKm) {
    cumulative += distance;
    stationDistances.push(roundKm(cumulative));
  }

  return stationDistances;
}

function pointDistanceDegrees(a: Coordinate, b: Coordinate) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function getBoundingBox(coords: LineCoordinates): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of coords) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { minX, minY, maxX, maxY };
}

function bboxContainsPointBuffer(
  bbox: BoundingBox,
  point: Coordinate,
  bufferDegrees: number,
) {
  return (
    point[0] >= bbox.minX - bufferDegrees &&
    point[0] <= bbox.maxX + bufferDegrees &&
    point[1] >= bbox.minY - bufferDegrees &&
    point[1] <= bbox.maxY + bufferDegrees
  );
}

function getGridKey(x: number, y: number) {
  return `${x}:${y}`;
}

function roundKm(value: number) {
  return Math.round(value * 10) / 10;
}
