import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { StationService } from './station.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { FilterStationDto } from './dto/filter-station.dto';

@Controller('station')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Get()
  findAll(@Query() query: FilterStationDto) {
    return this.stationService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stationService.findOne(id);
  }
}
