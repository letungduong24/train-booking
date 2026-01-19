import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoachTemplateService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.coachTemplate.findMany({
      orderBy: {
        code: 'asc'
      }
    });
  }
}
