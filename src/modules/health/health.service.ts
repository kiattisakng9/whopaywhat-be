import {
  DatabaseConnectionException,
  HealthCheckException,
  RedisConnectionException,
} from '@common/exceptions/health.exception';
import { REDIS_CLIENT } from '@database/redis.module';
import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import Redis from 'ioredis';
import { Connection, ConnectionStates } from 'mongoose';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  redis: string;
}

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    // Check MongoDB connection
    let databaseStatus = 'disconnected';
    try {
      if (this.mongoConnection.readyState === ConnectionStates.connected) {
        databaseStatus = 'connected';
      } else if (
        this.mongoConnection.readyState === ConnectionStates.disconnected
      ) {
        throw new DatabaseConnectionException('MongoDB is disconnected');
      }
    } catch (error) {
      if (error instanceof DatabaseConnectionException) {
        throw error;
      }
      databaseStatus = 'error';
      throw new DatabaseConnectionException('MongoDB connection check failed');
    }

    // Check Redis connection
    let redisStatus = 'disconnected';
    try {
      await this.redisClient.ping();
      redisStatus = 'connected';
    } catch {
      redisStatus = 'error';
      throw new RedisConnectionException('Redis connection check failed');
    }

    const overallStatus =
      databaseStatus === 'connected' && redisStatus === 'connected'
        ? 'healthy'
        : 'unhealthy';

    if (overallStatus === 'unhealthy') {
      throw new HealthCheckException('One or more services are unavailable');
    }

    return {
      status: overallStatus,
      timestamp,
      uptime,
      database: databaseStatus,
      redis: redisStatus,
    };
  }
}
