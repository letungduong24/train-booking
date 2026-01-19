import { Module } from '@nestjs/common';
import { CoachTemplateService } from './coach-template.service';
import { CoachTemplateController } from './coach-template.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoachTemplateController],
  providers: [CoachTemplateService],
})
export class CoachTemplateModule { }
