import {
  DatabaseConnectionException,
  HealthCheckException,
  RedisConnectionException,
} from '@common/exceptions/health.exception';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { ApiResponse, ResponseUtil } from '@common/utils/response.util';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import type { HealthCheckResponse, HealthService } from './health.service';

@Controller('health')
@UseInterceptors(ExceptionInterceptor)
export class HealthController {
  constructor(
    @Inject('HealthService') private readonly healthService: HealthService,
  ) {}

  @Get()
  async checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    try {
      const healthData = await this.healthService.checkHealth();
      if (!healthData) {
        throw new HealthCheckException(
          'Health check failed - no data returned',
        );
      }
      return ResponseUtil.success(healthData, 'Health check completed');
    } catch (error: unknown) {
      // Re-throw custom exceptions
      if (
        error instanceof DatabaseConnectionException ||
        error instanceof RedisConnectionException ||
        error instanceof HealthCheckException
      ) {
        throw error;
      }

      // Re-throw HTTP exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unknown errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HealthCheckException(
        `Health check failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
