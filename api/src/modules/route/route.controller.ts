import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/role.guard';
import { Roles } from '../../lib/decorators/roles.decorator';
import { Role } from '../../lib/enums/roles.enum';
import { FilterRouteDto } from './dto/filter-route.dto';
import { AddStationToRouteDto } from './dto/add-station-to-route.dto';
import { ReorderRouteStationsDto } from './dto/reorder-route-stations.dto';
import { UpdateRouteStationDto } from './dto/update-route-station.dto';
import { FilterAvailableStationsDto } from './dto/filter-available-stations.dto';

@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @Get()
  findAll(@Query() query: FilterRouteDto) {
    return this.routeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routeService.update(id, updateRouteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.routeService.remove(id);
  }

  @Post(':id/stations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  addStation(@Param('id') id: string, @Body() dto: AddStationToRouteDto) {
    return this.routeService.addStation(id, dto);
  }

  @Post(':id/stations/reorder')
  reorderStations(@Param('id') id: string, @Body() dto: ReorderRouteStationsDto) {
    return this.routeService.reorderStations(id, dto);
  }

  @Get(':id/stations/available')
  getAvailableStations(@Param('id') id: string, @Query() query: FilterAvailableStationsDto) {
    return this.routeService.getAvailableStations(id, query);
  }



  @Delete(':id/stations/:stationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  removeStation(@Param('id') id: string, @Param('stationId') stationId: string) {
    return this.routeService.removeStation(id, stationId);
  }

  @Patch(':id/stations/:stationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  updateStation(@Param('id') id: string, @Param('stationId') stationId: string, @Body() dto: UpdateRouteStationDto) {
    return this.routeService.updateStation(id, stationId, dto);
  }
}

