import { Injectable, ConflictException } from '@nestjs/common';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { FilterStationDto } from './dto/filter-station.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/client';

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) { }

  async findAll(query: FilterStationDto) {
    const { page = 1, limit = 10, skip, take, search, all, networkId } = query;

    const where: Prisma.StationWhereInput = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
      ...(networkId && { networkId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.station.findMany({
        where,
        ...(all !== 'true' && { skip }),
        ...(all !== 'true' && { take }),
        orderBy: {
          [query.sort || 'createdAt']: query.order || 'desc',
        },
      }),
      this.prisma.station.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string) {
    return this.prisma.station.findUnique({
      where: { id },
    });
  }
}
