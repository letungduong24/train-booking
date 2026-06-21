import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'src/lib/decorators/roles.decorator';
import { Role } from 'src/lib/enums/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { CreateTripDelayReportDto } from './dto/create-trip-delay-report.dto';
import { RejectTripDelayReportDto } from './dto/reject-trip-delay-report.dto';
import { TripDelayReportsService } from './trip-delay-reports.service';

@Controller('')
export class TripDelayReportsController {
  constructor(private readonly tripDelayReportsService: TripDelayReportsService) {}

  @Get('driver/trip-delay-reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Driver)
  getDriverReports(@Req() req: any) {
    return this.tripDelayReportsService.getDriverReports(req.user.id);
  }

  @Post('driver/trip-delay-reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Driver)
  createDriverReport(@Req() req: any, @Body() dto: CreateTripDelayReportDto) {
    return this.tripDelayReportsService.createDriverReport(req.user.id, dto);
  }

  @Get('admin/trip-delay-reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  getAdminReports() {
    return this.tripDelayReportsService.getAdminReports();
  }

  @Patch('admin/trip-delay-reports/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  approveReport(@Param('id') id: string) {
    return this.tripDelayReportsService.approveReport(id);
  }

  @Patch('admin/trip-delay-reports/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  rejectReport(@Param('id') id: string, @Body() dto: RejectTripDelayReportDto) {
    return this.tripDelayReportsService.rejectReport(id, dto.rejectReason);
  }
}
