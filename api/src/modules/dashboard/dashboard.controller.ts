import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from 'src/lib/decorators/roles.decorator';
import { Role } from 'src/lib/enums/roles.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(@Req() req: any) {
    return this.dashboardService.getOverview(req.user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getAdminOverview() {
    return this.dashboardService.getAdminOverview();
  }
}
