import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Configuration } from '../shared/config/index.js';
import { ENV, FLOW, QUEUE } from '../shared/enums/index.js';
import { DatabaseModule } from './database/database.module.js';
import { QueueModule } from './queue/queue.module.js';
import { RedisResourcesModule } from './redis/redis-resources.module.js';
import { RedisResourcesService, RuntimeLifecycleService } from './redis/redis-resources.service.js';
import { UploadModule } from './upload/upload.module.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [Configuration] }),
    RedisResourcesModule,
    DatabaseModule,
    UploadModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService, RedisResourcesService],
      isGlobal: true,
      useFactory: async (configService: ConfigService, redisResources: RedisResourcesService) => {
        const ttl = +configService.get(ENV.CACHE_TTL);

        return redisResources.cacheStore ? { stores: [redisResources.cacheStore], ttl } : { ttl };
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule, RedisResourcesModule],
      inject: [ConfigService, RedisResourcesService],
      useFactory: async (configService: ConfigService, redisResources: RedisResourcesService) => {
        const prefix = `{${configService.get(ENV.APP_NAME)}}:${configService.get(ENV.APP_ENV)}`;

        return {
          connection: redisResources.bullConnection,
          defaultJobOptions: {
            removeOnComplete: {
              age: 3600,
              count: 100,
            },
            removeOnFail: {
              age: 3600,
              count: 100,
            },
            attempts: 3,
          },
          prefix,
        };
      },
    }),
    QueueModule.register({
      queues: Object.values(QUEUE),
      flows: Object.values(FLOW),
    }),
  ],

  providers: [Logger, ConfigService, RuntimeLifecycleService],
  exports: [
    ConfigService,
    DatabaseModule,
    UploadModule,
    QueueModule,
    Logger,
    CacheModule,
    RuntimeLifecycleService,
  ],
})
export class CoreModule {}
