import { Controller, Post, Get, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GeojsonService } from './geojson.service';

@Controller('geojson')
export class GeojsonController {
    constructor(private readonly geojsonService: GeojsonService) { }

    @Post('sync')
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
    @Get('network')
    async getNetwork() {
        const network = await this.geojsonService.getNetworkData();
        return {
            message: 'Successfully retrieved network data.',
            data: network,
        };
    }
}
