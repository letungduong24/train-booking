import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatsService {
    constructor(private prisma: PrismaService) { }

    async update(id: string, updateSeatDto: UpdateSeatDto) {
        const seat = await this.prisma.seat.findUnique({
            where: { id },
        });

        if (!seat) {
            throw new NotFoundException(`Seat #${id} not found`);
        }

        return this.prisma.seat.update({
            where: { id },
            data: updateSeatDto,
        });
    }
}
