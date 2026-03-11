import { Module } from '@nestjs/common';
import { GeojsonController } from './geojson.controller';
import { GeojsonService } from './geojson.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GeojsonController],
    providers: [GeojsonService],
})
export class GeojsonModule { }
