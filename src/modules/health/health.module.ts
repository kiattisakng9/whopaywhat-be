import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: 'HealthService',
      useClass: HealthService,
    },
  ],
})
export class HealthModule {}
