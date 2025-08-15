import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseConnectionException extends HttpException {
  constructor(message: string = 'Database connection failed') {
    super(
      {
        error: 'DATABASE_CONNECTION_ERROR',
        message,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class RedisConnectionException extends HttpException {
  constructor(message: string = 'Redis connection failed') {
    super(
      {
        error: 'REDIS_CONNECTION_ERROR',
        message,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class HealthCheckException extends HttpException {
  constructor(
    message: string = 'Health check failed',
    statusCode: HttpStatus = HttpStatus.SERVICE_UNAVAILABLE,
  ) {
    super(
      {
        error: 'HEALTH_CHECK_ERROR',
        message,
        statusCode,
      },
      statusCode,
    );
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(service: string, message?: string) {
    const defaultMessage = `${service} service is currently unavailable`;
    super(
      {
        error: 'SERVICE_UNAVAILABLE',
        message: message || defaultMessage,
        service,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
