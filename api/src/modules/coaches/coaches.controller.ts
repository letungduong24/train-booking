import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CoachesService } from './coaches.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { FilterCoachDto } from './dto/filter-coach.dto';
import { ReorderCoachesDto } from './dto/reorder-coaches.dto';

@Controller('coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) { }

  @Post()
  create(@Body() createCoachDto: CreateCoachDto) {
    return this.coachesService.create(createCoachDto);
  }

  @Post('train/:trainId/reorder')
  reorderCoaches(@Param('trainId') trainId: string, @Body() dto: ReorderCoachesDto) {
    return this.coachesService.reorderCoaches(trainId, dto);
  }

  @Get()
  findAll(@Query() query: FilterCoachDto) {
    return this.coachesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coachesService.findOne(id);
  }

  @Get(':id/seats-with-prices')
  findOneWithSeatPrice(
    @Param('id') id: string,
    @Query('tripId') tripId: string,
    @Query('fromStationId') fromStationId: string,
    @Query('toStationId') toStationId: string,
  ) {
    return this.coachesService.findOneWithSeatPrice(id, tripId, fromStationId, toStationId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCoachDto: UpdateCoachDto) {
    return this.coachesService.update(id, updateCoachDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coachesService.remove(id);
  }
}
