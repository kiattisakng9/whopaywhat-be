import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  DatabaseConnectionException,
  RedisConnectionException,
  HealthCheckException,
  ServiceUnavailableException,
} from '@common/exceptions/health.exception';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExceptionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Exception caught: ${errorMessage}`, errorStack);

        // Handle custom exceptions
        if (
          error instanceof DatabaseConnectionException ||
          error instanceof RedisConnectionException ||
          error instanceof HealthCheckException ||
          error instanceof ServiceUnavailableException
        ) {
          return throwError(() => error);
        }

        // Handle generic HTTP exceptions
        if (error instanceof HttpException) {
          return throwError(() => error);
        }

        // Handle unknown errors
        const message =
          error instanceof Error ? error.message : 'Internal server error';
        const httpException = new HttpException(
          {
            error: 'INTERNAL_SERVER_ERROR',
            message,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );

        return throwError(() => httpException);
      }),
    );
  }
}
