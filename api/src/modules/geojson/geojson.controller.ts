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
            throw new BadRequestException('Vui lòng tải lên file GeoJSON mapData.');
        }

        const mapFile = files.mapData[0];

        try {
            const mapData = JSON.parse(mapFile.buffer.toString());

            const result = await this.geojsonService.processGeojsonData(mapData);
            return {
                message: 'Đã đồng bộ dữ liệu nền từ GeoJSON.',
                data: result,
            };
        } catch (error) {
            throw new BadRequestException(`Không thể xử lý file GeoJSON: ${error.message}`);
        }
    }
    @Get('networks')
    async getNetworks() {
        const networks = await this.geojsonService.getNetworks();
        return {
            message: 'Đã lấy danh sách network.',
            data: networks,
        };
    }

    @Get('network')
    async getNetwork(@Query('networkId') networkId?: string) {
        const network = await this.geojsonService.getNetworkData(networkId);
        return {
            message: 'Đã lấy dữ liệu network.',
            data: network,
        };
    }
}
