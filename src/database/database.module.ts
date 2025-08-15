import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri =
          configService.get<string>('database.uri') ||
          'mongodb://localhost:27017';
        const username = configService.get<string>('database.username');
        const password = configService.get<string>('database.password');

        // Only add authentication if both username and password are provided
        const connectionUri =
          username && password && !uri.includes('@')
            ? uri.replace(
                'mongodb://',
                `mongodb://${encodeURIComponent(
                  username,
                )}:${encodeURIComponent(password)}@`,
              )
            : uri;

        return {
          uri: connectionUri,
          dbName: configService.get<string>('database.name'),
          authSource:
            configService.get<string>('database.name') || 'whopaywhat',
          retryWrites: true,
          w: 'majority',
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
