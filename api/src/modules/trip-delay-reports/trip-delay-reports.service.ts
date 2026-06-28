import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TripDelayReportStatus,
  TripDelayType,
  TripStatus,
} from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { TripService } from '../trip/trip.service';
import { CreateTripDelayReportDto } from './dto/create-trip-delay-report.dto';

@Injectable()
export class TripDelayReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tripService: TripService,
  ) {}

  private isTripReportable(trip: {
    status: string;
    endTime: Date;
    departureDelayMinutes?: number | null;
    arrivalDelayMinutes?: number | null;
  }) {
    const actualEndTime = new Date(trip.endTime);
    actualEndTime.setMinutes(
      actualEndTime.getMinutes()
      + (trip.departureDelayMinutes ?? 0)
      + (trip.arrivalDelayMinutes ?? 0),
    );

    return (trip.status === TripStatus.SCHEDULED || trip.status === TripStatus.IN_PROGRESS)
      && new Date() <= actualEndTime;
  }

  private validateDelayTypeForTrip(type: TripDelayType, status: TripStatus) {
    if (type === TripDelayType.DEPARTURE && status !== TripStatus.SCHEDULED) {
      throw new BadRequestException('Chỉ có thể báo cáo trễ khởi hành khi chuyến tàu chưa khởi hành.');
    }

    if (type === TripDelayType.ARRIVAL && status !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException('Chỉ có thể báo cáo trễ đến ga khi chuyến tàu đang chạy.');
    }
  }

  private includeRelations() {
    return {
      trip: {
        include: {
          route: true,
          train: true,
        },
      },
      reportedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    };
  }

  async createDriverReport(driverId: string, dto: CreateTripDelayReportDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      select: {
        id: true,
        driverId: true,
        status: true,
        endTime: true,
        departureDelayMinutes: true,
        arrivalDelayMinutes: true,
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip #${dto.tripId} không tồn tại`);
    }

    if (trip.driverId !== driverId) {
      throw new BadRequestException('Bạn không được phân công điều khiển chuyến đi này');
    }

    if (!this.isTripReportable(trip)) {
      throw new BadRequestException('Chuyến tàu đã kết thúc hoặc không còn hoạt động. Không thể báo cáo delay.');
    }

    this.validateDelayTypeForTrip(dto.type, trip.status);

    const existingPending = await this.prisma.tripDelayReport.findFirst({
      where: {
        tripId: dto.tripId,
        type: dto.type,
        status: TripDelayReportStatus.PENDING,
      },
      select: { id: true },
    });

    if (existingPending) {
      throw new ConflictException('Chuyến này đã có báo cáo delay cùng loại đang chờ duyệt. Không thể gửi trùng.');
    }

    return this.prisma.tripDelayReport.create({
      data: {
        tripId: dto.tripId,
        reportedById: driverId,
        type: dto.type,
        minutes: dto.minutes,
        reason: dto.reason.trim(),
        status: TripDelayReportStatus.PENDING,
      },
      include: this.includeRelations(),
    });
  }

  async getDriverReports(driverId: string) {
    return this.prisma.tripDelayReport.findMany({
      where: { reportedById: driverId },
      include: this.includeRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminReports() {
    return this.prisma.tripDelayReport.findMany({
      include: this.includeRelations(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveReport(id: string) {
    const report = await this.prisma.tripDelayReport.findUnique({
      where: { id },
      include: {
        trip: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo delay');
    }

    if (report.status !== TripDelayReportStatus.PENDING) {
      throw new BadRequestException('Báo cáo delay này đã được xử lý.');
    }

    this.validateDelayTypeForTrip(report.type, report.trip.status);

    if (report.type === TripDelayType.DEPARTURE) {
      await this.tripService.setDepartureDelay(report.tripId, report.minutes);
    } else {
      await this.tripService.setArrivalDelay(report.tripId, report.minutes);
    }

    return this.prisma.tripDelayReport.update({
      where: { id },
      data: {
        status: TripDelayReportStatus.APPROVED,
        reviewedAt: new Date(),
      },
      include: this.includeRelations(),
    });
  }

  async rejectReport(id: string, rejectReason: string) {
    const report = await this.prisma.tripDelayReport.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo delay');
    }

    if (report.status !== TripDelayReportStatus.PENDING) {
      throw new BadRequestException('Báo cáo delay này đã được xử lý.');
    }

    return this.prisma.tripDelayReport.update({
      where: { id },
      data: {
        status: TripDelayReportStatus.REJECTED,
        rejectReason: rejectReason.trim(),
        reviewedAt: new Date(),
      },
      include: this.includeRelations(),
    });
  }
}
