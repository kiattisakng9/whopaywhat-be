import { SUPABASE_CLIENT } from '@/database/supabase.module';
import {
  DatabaseConnectionException,
  HealthCheckException,
  RedisConnectionException,
} from '@common/exceptions/health.exception';
import { REDIS_CLIENT } from '@database/redis.module';
import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { SupabaseClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { Connection, ConnectionStates } from 'mongoose';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  mongodb: string;
  redis: string;
  supabase: string;
}

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @Inject(SUPABASE_CLIENT) private readonly supabaseClient: SupabaseClient,
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

    // Check supabase connection
    let supabaseStatus = 'disconnected';
    try {
      await this.supabaseClient.auth.getUser();
      supabaseStatus = 'connected';
    } catch {
      supabaseStatus = 'error';
      throw new HealthCheckException('Supabase connection check failed');
    }

    // Check overall status
    const overallStatus =
      databaseStatus === 'connected' &&
      redisStatus === 'connected' &&
      supabaseStatus === 'connected'
        ? 'healthy'
        : 'unhealthy';

    if (overallStatus === 'unhealthy') {
      throw new HealthCheckException('One or more services are unavailable');
    }

    return {
      status: overallStatus,
      timestamp,
      uptime,
      mongodb: databaseStatus,
      redis: redisStatus,
      supabase: supabaseStatus,
    };
  }
}
