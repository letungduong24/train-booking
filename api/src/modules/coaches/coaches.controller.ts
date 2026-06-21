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
import { CoachesService } from './coaches.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { FilterCoachDto } from './dto/filter-coach.dto';
import { ReorderCoachesDto } from './dto/reorder-coaches.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../../lib/decorators/roles.decorator';
import { Role } from '../../lib/enums/roles.enum';

@Controller('coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  create(@Body() createCoachDto: CreateCoachDto) {
    return this.coachesService.create(createCoachDto);
  }

  @Post('train/:trainId/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  reorderCoaches(
    @Param('trainId') trainId: string,
    @Body() dto: ReorderCoachesDto,
  ) {
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
    return this.coachesService.findOneWithSeatPrice(
      id,
      tripId,
      fromStationId,
      toStationId,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updateCoachDto: UpdateCoachDto) {
    return this.coachesService.update(id, updateCoachDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.coachesService.remove(id);
  }
}
