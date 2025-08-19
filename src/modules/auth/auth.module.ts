import { PrismaService } from '@/database/prisma.service';
import { SupabaseService } from '@/database/supabase.service';
import { Logger, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, PrismaService, Logger],
  exports: [AuthService],
})
export class AuthModule {}
