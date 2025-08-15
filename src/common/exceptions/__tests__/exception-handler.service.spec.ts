import {
  DatabaseConnectionException,
  HealthCheckException,
  RedisConnectionException,
  ServiceUnavailableException,
} from '@common/exceptions/health.exception';
import { ExceptionHandlerService } from '@common/services/exception-handler.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('ExceptionHandlerService', () => {
  let service: ExceptionHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceptionHandlerService],
    }).compile();

    service = module.get<ExceptionHandlerService>(ExceptionHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleException', () => {
    it('should handle DatabaseConnectionException', () => {
      const exception = new DatabaseConnectionException(
        'Database connection failed',
      );
      const result = service.handleException(exception);

      expect(result).toEqual({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection failed',
        error: 'Database Connection Error',
        code: 'DB_CONNECTION_FAILED',
      });
    });

    it('should handle RedisConnectionException', () => {
      const exception = new RedisConnectionException('Redis connection failed');
      const result = service.handleException(exception);

      expect(result).toEqual({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Redis connection failed',
        error: 'Redis Connection Error',
        code: 'REDIS_CONNECTION_FAILED',
      });
    });

    it('should handle HealthCheckException', () => {
      const exception = new HealthCheckException('Health check failed');
      const result = service.handleException(exception);

      expect(result).toEqual({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Health check failed',
        error: 'Health Check Error',
        code: 'HEALTH_CHECK_FAILED',
      });
    });

    it('should handle ServiceUnavailableException', () => {
      const exception = new ServiceUnavailableException('Service unavailable');
      const result = service.handleException(exception);

      expect(result).toEqual({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service unavailable service is currently unavailable',
        error: 'Service Unavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    });

    it('should handle generic Error', () => {
      const exception = new Error('Generic error');
      const result = service.handleException(exception);

      expect(result).toEqual({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Generic error',
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should handle unknown exception', () => {
      const exception = 'Unknown error';
      const result = service.handleException(exception);

      expect(result).toEqual({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        error: 'Internal Server Error',
        code: 'UNKNOWN_ERROR',
      });
    });
  });

  describe('isRecoverableError', () => {
    it('should return true for recoverable errors', () => {
      expect(
        service.isRecoverableError(new DatabaseConnectionException('test')),
      ).toBe(true);
      expect(
        service.isRecoverableError(new RedisConnectionException('test')),
      ).toBe(true);
      expect(
        service.isRecoverableError(new ServiceUnavailableException('test')),
      ).toBe(true);
    });

    it('should return false for non-recoverable errors', () => {
      expect(service.isRecoverableError(new Error('test'))).toBe(false);
      expect(service.isRecoverableError(new HealthCheckException('test'))).toBe(
        false,
      );
      expect(service.isRecoverableError('unknown')).toBe(false);
    });
  });

  describe('isClientError', () => {
    it('should return true for client errors (4xx)', () => {
      const exception = new HealthCheckException(
        'test',
        HttpStatus.BAD_REQUEST,
      );
      expect(service.isClientError(exception)).toBe(true);
    });

    it('should return false for server errors (5xx)', () => {
      const exception = new DatabaseConnectionException('test');
      expect(service.isClientError(exception)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true for server errors (5xx)', () => {
      const exception = new DatabaseConnectionException('test');
      expect(service.isServerError(exception)).toBe(true);
    });

    it('should return false for client errors (4xx)', () => {
      const exception = new HealthCheckException(
        'test',
        HttpStatus.BAD_REQUEST,
      );
      expect(service.isServerError(exception)).toBe(false);
    });
  });

  describe('logException', () => {
    it('should log exception with context', () => {
      const loggerSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();
      const exception = new Error('Test error');
      const context = { method: 'GET', url: '/test' };

      service.logException(exception, context);

      expect(loggerSpy).toHaveBeenCalledWith(
        'GET /test - 500 - Test error',
        exception.stack,
      );
    });

    it('should log exception without context', () => {
      const loggerSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();
      const exception = new Error('Test error');

      service.logException(exception);

      expect(loggerSpy).toHaveBeenCalledWith(
        '500 - Test error',
        exception.stack,
      );
    });
  });
});
