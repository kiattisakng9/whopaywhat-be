import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      useFactory: (configService: ConfigService) => {
        const supabaseConfig = {
          url: configService.get<string>('supabase.url'),
          key: configService.get<string>('supabase.key'),
          serviceKey: configService.get<string>('supabase.serviceKey'),
        };

        if (!supabaseConfig.url || !supabaseConfig.key) {
          throw new Error('Supabase configuration is missing');
        }

        if (!supabaseConfig.serviceKey) {
          throw new Error('Supabase service key is missing');
        }

        return new SupabaseClient(supabaseConfig.url, supabaseConfig.key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
