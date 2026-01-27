import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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
        return this.tripService.searchTrips(query.fromStationId, query.toStationId, query.date);
    }

    @Get()
    findAll(@Query() query: FilterTripDto) {
        return this.tripService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tripService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto) {
        return this.tripService.update(id, updateTripDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tripService.remove(id);
    }
    @Patch(":id/departure-delay")
    setDepartureDelay(@Param("id") id: string, @Body() dto: SetDelayDto) {
        return this.tripService.setDepartureDelay(id, dto.minutes);
    }

    @Patch(":id/arrival-delay")
    setArrivalDelay(@Param("id") id: string, @Body() dto: SetDelayDto) {
        return this.tripService.setArrivalDelay(id, dto.minutes);
    }
}
