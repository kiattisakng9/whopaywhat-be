# Custom Exception Handling System

This document describes the comprehensive custom exception handling system implemented in the application.

## Overview

The custom exception handling system provides:
- **Custom Exception Classes**: Specific exceptions for different error scenarios
- **Global Exception Filter**: Centralized error handling and response formatting
- **Exception Handler Service**: Utility service for exception categorization and logging
- **Exception Interceptor**: Request-level exception interception
- **Standardized Error Responses**: Consistent error response format across the application

## Custom Exception Classes

### Health-Related Exceptions

Located in `src/common/exceptions/health.exception.ts`:

#### `DatabaseConnectionException`
- **Purpose**: Thrown when database connection fails
- **HTTP Status**: 503 Service Unavailable
- **Usage**: `throw new DatabaseConnectionException('Custom message')`

#### `RedisConnectionException`
- **Purpose**: Thrown when Redis connection fails
- **HTTP Status**: 503 Service Unavailable
- **Usage**: `throw new RedisConnectionException('Custom message')`

#### `HealthCheckException`
- **Purpose**: Thrown when health checks fail
- **HTTP Status**: Configurable (default: 503 Service Unavailable)
- **Usage**: `throw new HealthCheckException('Custom message', HttpStatus.BAD_REQUEST)`

#### `ServiceUnavailableException`
- **Purpose**: Thrown when a service is unavailable
- **HTTP Status**: 503 Service Unavailable
- **Usage**: `throw new ServiceUnavailableException('ServiceName', 'Optional custom message')`

## Exception Handler Service

Located in `src/common/services/exception-handler.service.ts`:

### Methods

#### `handleException(exception: unknown): ExceptionDetails`
Categorizes and extracts details from any exception.

#### `logException(exception: unknown, context?: { method?: string; url?: string }): void`
Logs exception details with optional request context.

#### `isRecoverableError(exception: unknown): boolean`
Determines if an error is recoverable (connection issues, service unavailable).

#### `isClientError(exception: unknown): boolean`
Checks if the exception represents a client error (4xx status codes).

#### `isServerError(exception: unknown): boolean`
Checks if the exception represents a server error (5xx status codes).

### Usage Example

```typescript
import { ExceptionHandlerService } from '@common/services/exception-handler.service';

@Injectable()
export class SomeService {
  constructor(private readonly exceptionHandler: ExceptionHandlerService) {}

  async someMethod() {
    try {
      // Some operation
    } catch (error) {
      // Log the exception
      this.exceptionHandler.logException(error, {
        method: 'POST',
        url: '/api/some-endpoint'
      });

      // Check if it's recoverable
      if (this.exceptionHandler.isRecoverableError(error)) {
        // Implement retry logic
      }

      throw error; // Re-throw for global handler
    }
  }
}
```

## Global Exception Filter

Located in `src/common/filters/global-exception.filter.ts`:

### Features
- **Automatic Exception Handling**: Catches all unhandled exceptions
- **Standardized Response Format**: Uses `ResponseUtil.error()` for consistent responses
- **Request Context Logging**: Logs method, URL, and error details
- **Custom Exception Support**: Handles all custom exception types
- **Fallback Handling**: Gracefully handles unknown exception types

### Response Format

```json
{
  "success": false,
  "message": "Error message",
  "data": {
    "statusCode": 503,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/health",
    "method": "GET",
    "error": "Database Connection Error"
  }
}
```

## Exception Interceptor

Located in `src/common/interceptors/exception.interceptor.ts`:

### Purpose
- **Request-Level Interception**: Catches exceptions at the request level
- **Custom Exception Handling**: Specifically handles health-related exceptions
- **Logging**: Provides detailed error logging with stack traces

### Usage

```typescript
@Controller('example')
@UseInterceptors(ExceptionInterceptor)
export class ExampleController {
  // Controller methods
}
```

## Integration

### Application Setup

The exception handling system is integrated at the application level:

1. **Global Filter Registration** (in `main.ts`):
```typescript
app.useGlobalFilters(new GlobalExceptionFilter());
```

2. **Module Registration** (in `app.module.ts`):
```typescript
@Module({
  imports: [ExceptionModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### Controller Integration

Example usage in the Health Controller:

```typescript
@Controller('health')
@UseInterceptors(ExceptionInterceptor)
export class HealthController {
  @Get()
  async checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    try {
      const healthData = await this.healthService.checkHealth();
      if (!healthData) {
        throw new HealthCheckException('Health check failed - no data returned');
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

      // Handle unknown errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HealthCheckException(
        `Health check failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

## Testing

Comprehensive tests are provided in `src/common/exceptions/__tests__/exception-handler.service.spec.ts`:

### Test Coverage
- Exception handling for all custom exception types
- Error categorization (recoverable, client, server errors)
- Logging functionality
- Edge cases and unknown exceptions

### Running Tests

```bash
# Run exception handler tests
npm test -- --testPathPatterns=exception-handler.service.spec.ts

# Run health controller tests
npm test -- --testPathPatterns=health.controller.spec.ts
```

## Best Practices

1. **Use Specific Exceptions**: Always use the most specific exception type for the error scenario
2. **Provide Meaningful Messages**: Include descriptive error messages that help with debugging
3. **Log Context**: Use the exception handler service to log errors with request context
4. **Handle Gracefully**: Implement proper error handling in services and controllers
5. **Test Exception Scenarios**: Write tests for both success and error scenarios

## Error Codes

The system uses standardized error codes:

- `DB_CONNECTION_FAILED`: Database connection issues
- `REDIS_CONNECTION_FAILED`: Redis connection issues
- `HEALTH_CHECK_FAILED`: Health check failures
- `SERVICE_UNAVAILABLE`: Service unavailability
- `INTERNAL_ERROR`: Generic internal errors
- `UNKNOWN_ERROR`: Unknown/unexpected errors

## Monitoring and Logging

All exceptions are automatically logged with:
- **Timestamp**: When the error occurred
- **Request Context**: HTTP method and URL
- **Error Details**: Message and stack trace
- **Status Code**: HTTP status code
- **Error Type**: Classification of the error

This enables effective monitoring and debugging of application issues.