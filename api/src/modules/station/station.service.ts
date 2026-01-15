import { Injectable, ConflictException } from '@nestjs/common';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { FilterStationDto } from './dto/filter-station.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/client';

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) { }

  async create(createStationDto: CreateStationDto) {
    const existing = await this.prisma.station.findFirst({
      where: { name: createStationDto.name }
    });
    if (existing) {
      throw new ConflictException('Tên trạm đã tồn tại');
    }
    return this.prisma.station.create({
      data: createStationDto,
    });
  }

  async findAll(query: FilterStationDto) {
    const { page = 1, limit = 10, skip, take, search } = query;

    const where: Prisma.StationWhereInput = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.station.findMany({
        where,
        skip,
        take,
        orderBy: {
          [query.sort || 'createdAt']: query.order || 'desc'
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

  update(id: string, updateStationDto: UpdateStationDto) {
    return this.prisma.station.update({
      where: { id },
      data: updateStationDto,
    });
  }

  remove(id: string) {
    return this.prisma.station.delete({
      where: { id },
    });
  }
}
