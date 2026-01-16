import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterTrainDto } from './dto/filter-train.dto';
import { Prisma } from '../../generated/client';

@Injectable()
export class TrainService {
  constructor(private prisma: PrismaService) { }

  async create(createTrainDto: CreateTrainDto) {
    const existing = await this.prisma.train.findUnique({
      where: { code: createTrainDto.code }
    });
    if (existing) {
      throw new ConflictException('Mã tàu đã tồn tại');
    }
    return this.prisma.train.create({
      data: createTrainDto,
    });
  }

  async findAll(query: FilterTrainDto = {}) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TrainWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.train.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sort || 'createdAt']: query.order || 'desc'
        },
      }),
      this.prisma.train.count({ where }),
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

  async findOne(id: string) {
    const train = await this.prisma.train.findUnique({
      where: { id },
    });
    if (!train) {
      throw new NotFoundException(`Train #${id} not found`);
    }
    return train;
  }

  async update(id: string, updateTrainDto: UpdateTrainDto) {
    return this.prisma.train.update({
      where: { id },
      data: updateTrainDto,
    });
  }

  async remove(id: string) {
    return this.prisma.train.delete({
      where: { id },
    });
  }
}
