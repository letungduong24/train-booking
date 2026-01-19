import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TrainModule } from './modules/train/train.module';
import { StationModule } from './modules/station/station.module';
import { RouteModule } from './modules/route/route.module';
import { CoachesModule } from './modules/coaches/coaches.module';
import { CoachTemplateModule } from './modules/coach-template/coach-template.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    TrainModule,
    StationModule,
    RouteModule,
    CoachesModule,
    CoachTemplateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
