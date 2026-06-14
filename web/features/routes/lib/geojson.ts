export type LngLat = [number, number];
export type RoutePathCoordinates = LngLat[][];

export interface NetworkLineLike {
  id: string;
  name?: string;
  pathCoordinates?: unknown;
}

export interface StationLike {
  latitude: number;
  longitude: number;
}

export function createRoutePathFeatureCollection(pathCoordinates?: RoutePathCoordinates | null) {
  const segments = normalizeLineSegments(pathCoordinates);
  if (segments.length === 0) return null;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "MultiLineString",
          coordinates: segments,
        },
      },
    ],
  } as GeoJSON.FeatureCollection<GeoJSON.MultiLineString>;
}

export function createStationLineFeatureCollection(stations: StationLike[]) {
  const coordinates = stations
    .filter((station) => isLngLat([station.longitude, station.latitude]))
    .map((station) => [station.longitude, station.latitude] as LngLat);

  if (coordinates.length < 2) return null;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    ],
  } as GeoJSON.FeatureCollection<GeoJSON.LineString>;
}

export function createNetworkLinesFeatureCollection(lines?: NetworkLineLike[] | null) {
  if (!lines || lines.length === 0) return null;

  const features: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>[] = [];

  for (const line of lines) {
    const segments = normalizeLineSegments(line.pathCoordinates);
    if (segments.length === 0) continue;

    features.push({
      type: "Feature",
      properties: { id: line.id, name: line.name },
      geometry:
        segments.length === 1
          ? {
              type: "LineString",
              coordinates: segments[0],
            }
          : {
              type: "MultiLineString",
              coordinates: segments,
            },
    });
  }

  if (features.length === 0) return null;

  return {
    type: "FeatureCollection",
    features,
  } as GeoJSON.FeatureCollection<GeoJSON.LineString | GeoJSON.MultiLineString>;
}

function normalizeLineSegments(pathCoordinates: unknown): LngLat[][] {
  if (isLineCoordinates(pathCoordinates)) {
    return [pathCoordinates];
  }

  if (!Array.isArray(pathCoordinates)) {
    return [];
  }

  return pathCoordinates.filter(isLineCoordinates);
}

function isLineCoordinates(value: unknown): value is LngLat[] {
  return Array.isArray(value) && value.length >= 2 && value.every(isLngLat);
}

function isLngLat(value: unknown): value is LngLat {
  if (!Array.isArray(value) || value.length < 2) return false;

  const [longitude, latitude] = value;
  return (
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    typeof latitude === "number" &&
    Number.isFinite(latitude)
  );
}
