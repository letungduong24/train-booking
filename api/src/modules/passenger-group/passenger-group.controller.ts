import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('passenger-groups')
export class PassengerGroupController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async findAll() {
        return this.prisma.passengerGroup.findMany({
            orderBy: [
                { minAge: 'asc' },
            ],
        });
    }
}
