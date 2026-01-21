import { Module } from '@nestjs/common';
import { PassengerGroupController } from './passenger-group.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PassengerGroupController],
})
export class PassengerGroupModule { }
