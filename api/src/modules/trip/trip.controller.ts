import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FilterTripDto } from './dto/filter-trip.dto';
import { SearchTripDto } from './dto/search-trip.dto';
import { SetDelayDto } from './dto/set-delay.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../../lib/decorators/roles.decorator';
import { Role } from '../../lib/enums/roles.enum';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
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

  @Get('drivers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  getDrivers() {
    return this.tripService.getDrivers();
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto) {
    return this.tripService.update(id, updateTripDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.tripService.remove(id);
  }
  @Patch(':id/departure-delay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  setDepartureDelay(@Param('id') id: string, @Body() dto: SetDelayDto) {
    return this.tripService.setDepartureDelay(id, dto.minutes);
  }

  @Patch(':id/arrival-delay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  setArrivalDelay(@Param('id') id: string, @Body() dto: SetDelayDto) {
    return this.tripService.setArrivalDelay(id, dto.minutes);
  }
}
