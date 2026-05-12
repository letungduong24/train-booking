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

    private generateCodeFromName(name: string): string {
        const unaccent = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const initials = unaccent.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('');
        return initials + Math.random().toString(36).substring(2, 5).toUpperCase();
    }

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

        // 1. Determine new Network version
        const lastNetwork = await this.prisma.network.findFirst({
            orderBy: { version: 'desc' },
        });
        const newVersion = lastNetwork ? lastNetwork.version + 1 : 1;

        const network = await this.prisma.network.create({
            data: {
                version: newVersion,
                name: `Network v${newVersion} - ${new Date().toLocaleDateString('vi-VN')}`
            }
        });

        this.logger.log(`Created new Network version ${newVersion} (ID: ${network.id})`);

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

            // Create station attached to the new network
            // We use the same code logic, but it's safe because unique is [code, networkId]
            await this.prisma.station.create({
                data: { 
                    name, 
                    code: this.generateCodeFromName(name),
                    latitude, 
                    longitude,
                    networkId: network.id
                },
            });
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

            // Create RailwayLine attached to the new network
            await this.prisma.railwayLine.create({
                data: {
                    name: routeName,
                    pathCoordinates: allSegments,
                    networkId: network.id
                },
            });
            results.networkLinesProcessed++;
        }

        this.logger.log(`Processed ${results.networkLinesProcessed} network lines.`);
        return results;
    }

    async getNetworkData(networkId?: string) {
        // If networkId not provided, get the latest active network
        let targetNetworkId = networkId;
        if (!targetNetworkId) {
            const latest = await this.prisma.network.findFirst({
                orderBy: { version: 'desc' }
            });
            targetNetworkId = latest?.id;
        }

        if (!targetNetworkId) {
            return { stations: [], lines: [] };
        }

        const stations = await this.prisma.station.findMany({ where: { networkId: targetNetworkId } });
        const lines = await this.prisma.railwayLine.findMany({ where: { networkId: targetNetworkId } });

        return {
            networkId: targetNetworkId,
            stations,
            lines,
        };
    }

    async getNetworks() {
        return this.prisma.network.findMany({
            orderBy: { version: 'desc' },
        });
    }
}
