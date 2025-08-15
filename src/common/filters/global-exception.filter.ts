import {
  DatabaseConnectionException,
  HealthCheckException,
  RedisConnectionException,
  ServiceUnavailableException,
} from '@common/exceptions/health.exception';
import { ResponseUtil } from '@common/utils/response.util';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let error: string;

    // Handle custom health exceptions
    if (exception instanceof DatabaseConnectionException) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = exception.message;
      error = 'Database Connection Error';
    } else if (exception instanceof RedisConnectionException) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = exception.message;
      error = 'Redis Connection Error';
    } else if (exception instanceof HealthCheckException) {
      status = exception.getStatus();
      message = exception.message;
      error = 'Health Check Error';
    } else if (exception instanceof ServiceUnavailableException) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = exception.message;
      error = 'Service Unavailable';
    } else if (exception instanceof HttpException) {
      // Handle standard HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as Record<string, unknown>)
              ?.message as string) || exception.message;
      error = exception.name;
    } else {
      // Handle unknown exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Send error response
    response.status(status).json(
      ResponseUtil.error(message, {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        error,
      }),
    );
  }
}
