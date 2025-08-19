import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Enable global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Enable Zod validation globally
    app.useGlobalPipes(new ZodValidationPipe());

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

bootstrap()
  .then(() => {
    logger.log('Application started successfully');
  })
  .catch((error) => {
    logger.error('Error starting application:', error);
    process.exit(1);
  });
