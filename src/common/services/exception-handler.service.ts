import {
  DatabaseConnectionException,
  HealthCheckException,
  RedisConnectionException,
  ServiceUnavailableException,
} from '@common/exceptions/health.exception';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

export interface ExceptionDetails {
  status: HttpStatus;
  message: string;
  error: string;
  code?: string;
}

@Injectable()
export class ExceptionHandlerService {
  private readonly logger = new Logger(ExceptionHandlerService.name);

  /**
   * Handles and categorizes different types of exceptions
   * @param exception The exception to handle
   * @returns ExceptionDetails with status, message, and error type
   */
  handleException(exception: unknown): ExceptionDetails {
    // Handle custom health exceptions
    if (exception instanceof DatabaseConnectionException) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: exception.message,
        error: 'Database Connection Error',
        code: 'DB_CONNECTION_FAILED',
      };
    }

    if (exception instanceof RedisConnectionException) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: exception.message,
        error: 'Redis Connection Error',
        code: 'REDIS_CONNECTION_FAILED',
      };
    }

    if (exception instanceof HealthCheckException) {
      return {
        status: exception.getStatus(),
        message: exception.message,
        error: 'Health Check Error',
        code: 'HEALTH_CHECK_FAILED',
      };
    }

    if (exception instanceof ServiceUnavailableException) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: exception.message,
        error: 'Service Unavailable',
        code: 'SERVICE_UNAVAILABLE',
      };
    }

    // Handle standard Error instances
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      };
    }

    // Handle unknown exceptions
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Logs exception details
   * @param exception The exception to log
   * @param context Additional context for logging
   */
  logException(
    exception: unknown,
    context?: { method?: string; url?: string },
  ): void {
    const details = this.handleException(exception);
    const contextInfo = context ? `${context.method} ${context.url} - ` : '';

    this.logger.error(
      `${contextInfo}${details.status} - ${details.message}`,
      exception instanceof Error ? exception.stack : undefined,
    );
  }

  /**
   * Checks if an exception is a recoverable error
   * @param exception The exception to check
   * @returns true if the error is recoverable
   */
  isRecoverableError(exception: unknown): boolean {
    return (
      exception instanceof DatabaseConnectionException ||
      exception instanceof RedisConnectionException ||
      exception instanceof ServiceUnavailableException
    );
  }

  /**
   * Checks if an exception is a client error (4xx)
   * @param exception The exception to check
   * @returns true if it's a client error
   */
  isClientError(exception: unknown): boolean {
    const details = this.handleException(exception);
    return (
      details.status >= HttpStatus.BAD_REQUEST &&
      details.status < HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Checks if an exception is a server error (5xx)
   * @param exception The exception to check
   * @returns true if it's a server error
   */
  isServerError(exception: unknown): boolean {
    const details = this.handleException(exception);
    return details.status >= HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
