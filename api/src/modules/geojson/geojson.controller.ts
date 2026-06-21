import { Controller, Post, Get, UseInterceptors, UploadedFiles, BadRequestException, Query, UseGuards } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GeojsonService } from './geojson.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../../lib/decorators/roles.decorator';
import { Role } from '../../lib/enums/roles.enum';

@Controller('geojson')
export class GeojsonController {
    constructor(private readonly geojsonService: GeojsonService) { }

    @Post('sync')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'mapData', maxCount: 1 },
        ]),
    )
    async syncGeojson(
        @UploadedFiles()
        files: {
            mapData?: Express.Multer.File[];
        },
    ) {
        if (!files.mapData) {
            throw new BadRequestException('GeoJSON mapData file is required.');
        }

        const mapFile = files.mapData[0];

        try {
            const mapData = JSON.parse(mapFile.buffer.toString());

            const result = await this.geojsonService.processGeojsonData(mapData);
            return {
                message: 'Successfully synchronized Master Data from GeoJSON.',
                data: result,
            };
        } catch (error) {
            throw new BadRequestException(`Failed to process GeoJSON files: ${error.message}`);
        }
    }
    @Get('networks')
    async getNetworks() {
        const networks = await this.geojsonService.getNetworks();
        return {
            message: 'Successfully retrieved networks list.',
            data: networks,
        };
    }

    @Get('network')
    async getNetwork(@Query('networkId') networkId?: string) {
        const network = await this.geojsonService.getNetworkData(networkId);
        return {
            message: 'Successfully retrieved network data.',
            data: network,
        };
    }
}
