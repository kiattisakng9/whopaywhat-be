import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Enable global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Enable validation globally
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Enable CORS
    app.enableCors({
      origin: true,
      credentials: true,
    });

    const port = configService.get<number>('port') || 3001;
    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    logger.error('Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();
