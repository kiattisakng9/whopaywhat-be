import { MongoDBModule } from '@/database/mongodb.module';
import { ExceptionModule } from '@common/exceptions/exception.module';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import configuration from '@config/configuration';
import { RedisModule } from '@database/redis.module';
import { HealthModule } from '@modules/health/health.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongoDBModule,
    RedisModule,
    HealthModule,
    ExceptionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
