import { BullModule } from '@nestjs/bullmq';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppCacheModule } from './cache/cache.module.js';
import { type Configuration, configuration } from './config/configuration.js';
import { DatabaseModule } from './data-access/database.module.js';
import { FLOW, QUEUE } from './queue/queue.constants.js';
import { QueueModule } from './queue/queue.module.js';
import { RedisResourcesService, RuntimeLifecycleService } from './redis/redis-resources.service.js';
import { RedisModule } from './redis/redis.module.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    RedisModule,
    DatabaseModule,
    AppCacheModule,
    BullModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      inject: [configuration.KEY, RedisResourcesService],
      useFactory: async (config: Configuration, redisResources: RedisResourcesService) => {
        const prefix = `{${config.app.name}}:${config.app.environment}`;

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

  providers: [Logger, RuntimeLifecycleService],
  exports: [DatabaseModule, QueueModule, Logger, AppCacheModule, RuntimeLifecycleService],
})
export class CoreModule {}
