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
        const initials = unaccent
            .split(/\s+/)
            .map(w => w[0]?.toUpperCase() || '')
            .join('')
            .replace(/[^A-Z0-9]/g, '');
        return initials || 'GA';
    }

    private createUniqueStationCode(name: string, usedCodes: Set<string>): string {
        const baseCode = this.generateCodeFromName(name);
        let code = baseCode;
        let suffix = 2;

        while (usedCodes.has(code)) {
            code = `${baseCode}${suffix}`;
            suffix++;
        }

        usedCodes.add(code);
        return code;
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

        await this.prisma.$transaction(async (tx) => {
            // 1. Determine new Network version
            const lastNetwork = await tx.network.findFirst({
                orderBy: { version: 'desc' },
            });
            const newVersion = lastNetwork ? lastNetwork.version + 1 : 1;

            const network = await tx.network.create({
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
            const usedCodes = new Set<string>();

            for (const feature of validStations) {
                const name = feature.properties?.Ten_Ga || feature.properties?.['name:vi'] || feature.properties?.name;
                const _longitude = feature.geometry.coordinates[0];
                const _latitude = feature.geometry.coordinates[1];

                const longitude = typeof _longitude === 'string' ? parseFloat(_longitude) : Number(_longitude);
                const latitude = typeof _latitude === 'string' ? parseFloat(_latitude) : Number(_latitude);

                if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
                    throw new Error(`Tọa độ ga ${name} không hợp lệ`);
                }

                await tx.station.create({
                    data: { 
                        name, 
                        code: this.createUniqueStationCode(name, usedCodes),
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

                await tx.railwayLine.create({
                    data: {
                        name: routeName,
                        pathCoordinates: allSegments,
                        networkId: network.id
                    },
                });
                results.networkLinesProcessed++;
            }
        }, { timeout: 30000 });

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
