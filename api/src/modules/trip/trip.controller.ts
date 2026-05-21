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
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FilterTripDto } from './dto/filter-trip.dto';
import { SearchTripDto } from './dto/search-trip.dto';
import { SetDelayDto } from './dto/set-delay.dto';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) { }

  @Post()
  create(@Body() createTripDto: CreateTripDto) {
    return this.tripService.create(createTripDto);
  }

  @Get('search')
  search(@Query() query: SearchTripDto) {
    return this.tripService.searchTrips(
      query.fromStationId,
      query.toStationId,
      query.date,
    );
  }

  @Get('debug-search')
  async debugSearch(@Query() query: SearchTripDto) {
    const route = await this.tripService['prisma'].route.findUnique({
      where: { id: '4fbefd74-6561-4e7f-a83a-f7137af06f39' },
      include: { stations: { include: { station: true }, orderBy: { index: 'asc' } } }
    });
    
    return {
      routeId: route?.id,
      routeName: route?.name,
      networkId: route?.networkId,
      status: route?.status,
      stations: route?.stations.map(rs => ({
        index: rs.index,
        stationId: rs.stationId,
        stationCode: rs.station.code,
        stationName: rs.station.name,
      })),
    };
  }

  @Get()
  findAll(@Query() query: FilterTripDto) {
    return this.tripService.findAll(query);
  }

  @Get(':id/stats')
  getTripStats(@Param('id') id: string) {
    return this.tripService.getTripStats(id);
  }

  @Get(':id/live-location')
  getLiveLocation(
    @Param('id') id: string,
    @Query('speedup') speedup?: string,
  ) {
    const speedupVal = speedup ? parseFloat(speedup) : undefined;
    return this.tripService.getLiveLocation(id, speedupVal);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tripService.findOne(id, from, to);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto) {
    return this.tripService.update(id, updateTripDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripService.remove(id);
  }
  @Patch(':id/departure-delay')
  setDepartureDelay(@Param('id') id: string, @Body() dto: SetDelayDto) {
    return this.tripService.setDepartureDelay(id, dto.minutes);
  }

  @Patch(':id/arrival-delay')
  setArrivalDelay(@Param('id') id: string, @Body() dto: SetDelayDto) {
    return this.tripService.setArrivalDelay(id, dto.minutes);
  }
}
