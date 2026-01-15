import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ForbiddenExceptionFilter } from './lib/filters/forbidden.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with credentials
  app.enableCors({
    origin: true, // In production, specify exact origins
    credentials: true,
  });

  // Enable cookie parser
  app.use(cookieParser());

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new ForbiddenExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
