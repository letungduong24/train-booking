import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from 'src/lib/decorators/roles.decorator';
import { Role } from 'src/lib/enums/roles.enum';
import { SeatIssuesService } from './seat-issues.service';

@Controller('')
export class SeatIssuesController {
  constructor(private readonly seatIssuesService: SeatIssuesService) {}

  // ================= DRIVER PORTAL ENDPOINTS =================

  @Get('driver/trips')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Driver)
  async getDriverTrips(@Req() req: any) {
    return this.seatIssuesService.getDriverTrips(req.user.id);
  }

  @Get('driver/trips/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Driver)
  async getDriverTripDetail(@Param('id') id: string, @Req() req: any) {
    return this.seatIssuesService.getDriverTripDetail(id, req.user.id);
  }

  @Get('driver/seat-issues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Driver)
  async getDriverIssues(@Req() req: any) {
    return this.seatIssuesService.getDriverIssues(req.user.id);
  }

  @Post('driver/seat-issues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Driver)
  async createDriverIssue(
    @Req() req: any,
    @Body() body: { tripId: string; seatId: string; issueType: string; description: string },
  ) {
    return this.seatIssuesService.createDriverIssue(req.user.id, body);
  }

  // ================= ADMIN PORTAL ENDPOINTS =================

  @Get('admin/seat-issues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminIssues() {
    return this.seatIssuesService.getAdminIssues();
  }

  @Get('admin/seat-issues/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getAdminIssueDetail(@Param('id') id: string) {
    return this.seatIssuesService.getAdminIssueDetail(id);
  }

  @Patch('admin/seat-issues/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async rejectIssue(
    @Param('id') id: string,
    @Body() body: { rejectReason: string },
  ) {
    return this.seatIssuesService.rejectIssue(id, body.rejectReason);
  }

  @Patch('admin/seat-issues/:id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async confirmIssue(@Param('id') id: string) {
    return this.seatIssuesService.confirmIssue(id);
  }

  // ================= CUSTOMER PORTAL ENDPOINTS =================

  @Get('tickets/replacement-options')
  async getReplacementOptions(@Query('token') token: string) {
    return this.seatIssuesService.getReplacementOptions(token);
  }

  @Post('tickets/confirm-replacement')
  async confirmReplacement(
    @Body() body: { token: string; seatId: string },
  ) {
    return this.seatIssuesService.confirmReplacement(body.token, body.seatId);
  }

  @Post('tickets/reject-replacement')
  async rejectReplacement(
    @Body() body: { token: string },
  ) {
    return this.seatIssuesService.rejectReplacement(body.token);
  }
}
