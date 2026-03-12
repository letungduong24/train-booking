import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FeatureCollection, Point, LineString, MultiLineString, Feature } from 'geojson';
import * as turf from '@turf/turf';
import { Station } from '../../generated/client';

interface StationWithFeature extends Station {
    feature: Feature<Point>;
}

@Injectable()
export class GeojsonService {
    private readonly logger = new Logger(GeojsonService.name);

    private stitchSegments(segments: Feature<LineString | MultiLineString>[]): number[][] {
        // Disabled aggressive stitching. Real OSM data often has disconnected branches,
        // and Turf supports picking nearest points directly from a MultiLineString.
        // Returning empty array as a fallback in case this is called elsewhere.
        return [];
    }

    constructor(private readonly prisma: PrismaService) { }

    async processGeojsonData(mapData: FeatureCollection<any>) {
        this.logger.log(`Processing GeoJSON Data...`);
        const results = {
            stationsProcessed: 0,
            networkLinesProcessed: 0,
        };

        // Wipe existing network. 
        // Note: Thanks to onDelete: Cascade on RouteStation, this will remove the bindings between Routes and Stations without deleting the Routes themselves.
        await this.prisma.station.deleteMany({});
        await this.prisma.railwayLine.deleteMany({});

        // 1. Process Stations
        const validStations = mapData.features.filter(
            (f) => f.geometry.type === 'Point' && (f.properties?.name || f.properties?.['name:vi'] || f.properties?.Ten_Ga),
        );

        for (const feature of validStations) {
            const name = feature.properties?.Ten_Ga || feature.properties?.['name:vi'] || feature.properties?.name;
            const _longitude = feature.geometry.coordinates[0];
            const _latitude = feature.geometry.coordinates[1];

            const longitude = typeof _longitude === 'string' ? parseFloat(_longitude) : Number(_longitude);
            const latitude = typeof _latitude === 'string' ? parseFloat(_latitude) : Number(_latitude);

            // Upsert station by name. Since name is not @unique, we use findFirst + create/update
            let station = await this.prisma.station.findFirst({ where: { name } });
            if (station) {
                await this.prisma.station.update({
                    where: { id: station.id },
                    data: { latitude, longitude },
                });
            } else {
                await this.prisma.station.create({
                    data: { name, latitude, longitude },
                });
            }
            results.stationsProcessed++;
        }
        this.logger.log(`Processed ${results.stationsProcessed} stations.`);

        // 2. Identify and Combine Routes into RailwayLines
        const routeGroups = new Map<string, Feature<LineString | MultiLineString>[]>();
        for (const feature of mapData.features) {
            if (feature.geometry.type !== 'LineString' && feature.geometry.type !== 'MultiLineString') continue;
            // Many railways might share a common "network" or root name. e.g "Đường sắt Bắc Nam"
            const name = feature.properties?.ten || feature.properties?.['name:vi'] || feature.properties?.name || "Các đoạn đường sắt khác";

            if (!routeGroups.has(name)) {
                routeGroups.set(name, []);
            }
            routeGroups.get(name)!.push(feature);
        }

        for (const [routeName, segments] of routeGroups.entries()) {
            let allSegments: number[][][] = [];
            for (const s of segments) {
                if (s.geometry.type === 'LineString') {
                    allSegments.push(s.geometry.coordinates as number[][]);
                } else if (s.geometry.type === 'MultiLineString') {
                    allSegments.push(...(s.geometry.coordinates as number[][][]));
                }
            }

            if (allSegments.length === 0) {
                continue;
            }

            // Create RailwayLine in DB containing ALL distinct components as one large MultiLineString
            await this.prisma.railwayLine.create({
                data: {
                    name: routeName,
                    pathCoordinates: allSegments,
                },
            });
            results.networkLinesProcessed++;
        }

        this.logger.log(`Processed ${results.networkLinesProcessed} network lines.`);
        return results;
    }

    async getNetworkData() {
        const stations = await this.prisma.station.findMany();
        const lines = await this.prisma.railwayLine.findMany();

        return {
            stations,
            lines,
        };
    }
}
