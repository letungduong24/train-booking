import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { SeatStatus } from '../../generated/client';

@Injectable()
export class SeatsService {
  constructor(private prisma: PrismaService) {}

  async update(id: string, updateSeatDto: UpdateSeatDto) {
    const seat = await this.prisma.seat.findUnique({
      where: { id },
    });

    if (!seat) {
      throw new NotFoundException('Không tìm thấy ghế');
    }

    if (
      updateSeatDto.status &&
      updateSeatDto.status !== SeatStatus.AVAILABLE &&
      updateSeatDto.status !== seat.status
    ) {
      const activePaidTickets = await this.prisma.ticket.count({
        where: {
          seatId: id,
          booking: { status: 'PAID' },
          trip: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
        },
      });

      if (activePaidTickets > 0) {
        throw new ConflictException(
          'Ghế đã có khách trên chuyến chưa kết thúc. Vui lòng xử lý bằng báo cáo sự cố ghế để hệ thống gửi email đổi ghế hoặc hoàn tiền.',
        );
      }
    }

    return this.prisma.seat.update({
      where: { id },
      data: updateSeatDto,
    });
  }
}
