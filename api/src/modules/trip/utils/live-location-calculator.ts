type Coordinate = [number, number];

interface RouteStationLike {
  station?: {
    longitude: number;
    latitude: number;
  } | null;
}

interface TripLike {
  status: string;
  departureTime: Date;
  departureDelayMinutes: number;
  arrivalDelayMinutes: number;
  route: {
    durationMinutes: number;
    totalDistanceKm: number;
    pathCoordinates: unknown;
    stations: RouteStationLike[];
  };
  train?: {
    averageSpeedKmH: number;
  } | null;
}

export interface LiveLocationSnapshot {
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  progress: number;
  status: string;
  departureDelayMinutes: number;
  arrivalDelayMinutes: number;
  shouldMarkCompleted: boolean;
}

export function calculateLiveLocationSnapshot(
  trip: TripLike,
  speedup?: number,
  nowMs = Date.now(),
): LiveLocationSnapshot {
  const {
    status,
    departureTime,
    departureDelayMinutes = 0,
    arrivalDelayMinutes = 0,
    route,
    train,
  } = trip;

  const allPoints = extractRoutePoints(route.pathCoordinates, route.stations);
  const firstStation = route.stations[0]?.station;
  const defaultLng = firstStation?.longitude ?? 105.8542;
  const defaultLat = firstStation?.latitude ?? 21.0285;

  if (allPoints.length < 2) {
    return {
      latitude: defaultLat,
      longitude: defaultLng,
      bearing: 0,
      speed: 0,
      progress: 0,
      status,
      departureDelayMinutes,
      arrivalDelayMinutes,
      shouldMarkCompleted: false,
    };
  }

  const averageSpeedKmH = train?.averageSpeedKmH ?? 0;
  const durationMinutes =
    route.totalDistanceKm > 0 && averageSpeedKmH > 0
      ? Math.round((route.totalDistanceKm / averageSpeedKmH) * 60)
      : route.durationMinutes || 60;

  const totalDurationMs = Math.max(
    60 * 1000,
    (durationMinutes + arrivalDelayMinutes) * 60 * 1000,
  );
  const startMs = new Date(departureTime).getTime() + departureDelayMinutes * 60 * 1000;
  const elapsedMs = (nowMs - startMs) * (speedup && speedup > 0 ? speedup : 1);
  const simulatedNow = startMs + elapsedMs;
  const endMs = startMs + totalDurationMs;

  let currentStatus = status;
  if (currentStatus === 'SCHEDULED' && simulatedNow >= startMs) {
    currentStatus = 'IN_PROGRESS';
  }
  if (currentStatus === 'IN_PROGRESS' && simulatedNow >= endMs) {
    currentStatus = 'COMPLETED';
  }

  const progress =
    currentStatus === 'COMPLETED'
      ? 1
      : currentStatus === 'IN_PROGRESS'
        ? clamp(elapsedMs / totalDurationMs, 0, 1)
        : 0;

  const { longitude, latitude, bearing } = interpolateOnPath(allPoints, progress);
  const baseSpeed = train?.averageSpeedKmH ?? 60;
  const speed =
    currentStatus === 'IN_PROGRESS'
      ? Math.max(10, Math.round(baseSpeed + Math.sin(simulatedNow / 5000) * 5))
      : 0;

  return {
    latitude,
    longitude,
    bearing,
    speed,
    progress,
    status: currentStatus,
    departureDelayMinutes,
    arrivalDelayMinutes,
    shouldMarkCompleted: status === 'IN_PROGRESS' && currentStatus === 'COMPLETED',
  };
}

function extractRoutePoints(pathCoordinates: unknown, stations: RouteStationLike[]) {
  const points: Coordinate[] = [];

  if (Array.isArray(pathCoordinates)) {
    for (const segment of pathCoordinates) {
      if (!Array.isArray(segment)) continue;

      for (const point of segment) {
        const coord = normalizeCoordinate(point);
        if (coord) points.push(coord);
      }
    }
  }

  if (points.length >= 2) return dedupeConsecutive(points);

  return stations
    .map((routeStation) => routeStation.station)
    .filter((station): station is NonNullable<RouteStationLike['station']> => !!station)
    .map((station) => [station.longitude, station.latitude] as Coordinate)
    .filter(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude));
}

function normalizeCoordinate(value: unknown): Coordinate | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const longitude = Number(value[0]);
  const latitude = Number(value[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  return [longitude, latitude];
}

function dedupeConsecutive(points: Coordinate[]) {
  return points.filter((point, index) => {
    if (index === 0) return true;
    const previous = points[index - 1];
    return previous[0] !== point[0] || previous[1] !== point[1];
  });
}

function interpolateOnPath(points: Coordinate[], progress: number) {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + distanceKm(points[i - 1], points[i]));
  }

  const totalDistance = distances[distances.length - 1];
  if (totalDistance <= 0) {
    return { longitude: points[0][0], latitude: points[0][1], bearing: 0 };
  }

  const targetDistance = clamp(progress, 0, 1) * totalDistance;
  let index = 0;
  while (index < distances.length - 2 && distances[index + 1] < targetDistance) {
    index++;
  }

  const segmentDistance = distances[index + 1] - distances[index];
  const t = segmentDistance > 0 ? (targetDistance - distances[index]) / segmentDistance : 0;
  const start = points[index];
  const end = points[index + 1];
  const longitude = start[0] + t * (end[0] - start[0]);
  const latitude = start[1] + t * (end[1] - start[1]);

  return {
    longitude,
    latitude,
    bearing: bearingDegrees(start, end),
  };
}

function distanceKm(a: Coordinate, b: Coordinate) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b[1] - a[1]);
  const dLng = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function bearingDegrees(a: Coordinate, b: Coordinate) {
  const dLng = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
